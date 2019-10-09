const tooltip = floatingTooltip("chart-tooltip", 100);
const color = d3.scaleOrdinal(d3.schemeCategory10);
let mainsvg = d3.select("#mainsvg")
let width = mainsvg.style('width').replace('px', ''),
    height = mainsvg.style("height").replace('px', '');
let forceStrength = 0.15;
let center = {x: width / 2, y: height / 2};
let simulation = null,
    thicknessScale = null,
    radiusScale = null;

function updateDraw(svg, links, thicknessScale, nodes, radiusScale, simulation) {

    let link = svg.select(".links")
        .selectAll("g")
        .data(links, function (d) {
            return d.source.key + "" + d.target.key;
        })
        .attr("stroke", d => color(d.label));

    link.select("line")
        .attr("fill", d => color(d.label))
        .attr("stroke-width", function (d) {
            return thicknessScale(d.value)
        });

    link.exit().remove();

    link.enter()
        .append("g")
        .attr("stroke", d => color(d.label))
        .append("line")
        .attr("fill", d => color(d.label))
        .attr("stroke-width", function (d) {
            return thicknessScale(d.value)
        });

    let node = svg.select(".nodes")
        .selectAll("g")
        .data(nodes, d => d.key);

    node.select("circle")
        .attr("r", function (d) {
            return radiusScale(d.values.length);
        });

    node.exit().remove();

    node.enter()
        .append("g")
        .append("circle")
        .attr("r", function (d) {
            return radiusScale(d.values.length);
        })
        .attr("fill", "#7f7f7f")
        .call(drag(simulation))
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail);

    node = svg.select(".nodes")
        .selectAll("g");

    link = svg.select(".links")
        .selectAll("g").select("line");

    return {link, node};
}

function initialization(svg) {

    svg.append("g")
        .attr("class", "links")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.8);

    svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("class", "nodes");
}

function updateNetwork(data, svg) {
    const nodes = createNodes(data);
    const idToUsername = idToUsernameMap(nodes);
    const links = createLinks(nodes, data, idToUsername);

    console.log(nodes);
    console.log(links);

    simulation.nodes(nodes)
        .force("link", d3.forceLink(links).id(d => d.key).distance(20).strength(0.5));

    const {link, node} = updateDraw(svg, links, thicknessScale, nodes, radiusScale, simulation);

    simulation.on("tick", function () {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", function (d) {
            return `translate(${d.x}, ${d.y})`;
        });

        if (simulation.alpha() <= 0.07) {
            simulation.stop()
        }
    });
}

function createNetwork(data, mainsvg) {
    var max = -1;

    const nodes = createNodes(data);
    const idToUsername = idToUsernameMap(nodes);
    const links = createLinks(nodes, data, idToUsername);

    nodes.forEach(function (d) {
        if (d.values.length > max) {
            max = d.values.length;
        }
    });

    radiusScale = d3.scaleSqrt()
        .range([3, 20])
        .domain([1, max]);

    var maxThickness = -1;
    links.forEach(function (d) {
        if (d.value > maxThickness) {
            maxThickness = d.value;
        }
    });

    thicknessScale = d3.scaleSqrt()
        .range([1, 5])
        .domain([1, maxThickness]);

    simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(-10))
        .force('collision', d3.forceCollide().radius(function (d) {
            return radiusScale(d.values.length);
        })
            .iterations(10))
        .force('x', d3.forceX().strength(forceStrength / 2).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .velocityDecay(0.2)
        .alphaTarget(0.05);

    updateNetwork(data, mainsvg)
}

function showDetail(d) {
    d3.select(this).attr("stroke", "black");

    var connections = 0;
    if (d.connections) {
        connections = d.connections;
    }

    var content =
        '<span class="name">Author: </span><span class="value">' +
        d.key +
        '</span><br/>' +
        '<span class="name">Posts: </span><span class="value">' +
        d.values.length +
        '</span><br/>' +
        '<span class="name">Interactions: </span><span class="value">' +
        connections;

    tooltip.showTooltip(content, d3.event);
}

function hideDetail(d) {
    d3.select(this)
        .attr('stroke', function (d) {
            return "#ffffff";
        });

    tooltip.hideTooltip();
}

drag = simulation => {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0.05);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
};


function idToUsernameMap(nodes) {
    var map = {};
    nodes.forEach(function (d) {
        d.values.forEach(function (v) {
            map[v.id] = d.key;
        })
    });

    return map;
}

function createNodes(data) {
    var nodes = d3.nest().key(d => d.by).entries(data);

    return nodes;
}

function updateNodeConnections(key, nodes) {
    nodes.forEach(function (d, i) {
        if (d.key === key) {
            if (d.connections) {
                nodes[i].connections += 1;
            } else {
                nodes[i]['connections'] = 1;
            }
        }
    });
}

function createLinks(nodes, data, idToUsername) {

    var links = [];

    data.forEach(function (d) {
        var name = d.by;
        var currnetId = d.id;
        var parentId = d.parent;
        var label = d.label;
        var parentName = idToUsername[parentId];
        var source = '';
        var target = '';

        if (name > parentName) {
            source = parentName;
            target = name;
        } else {
            source = name;
            target = parentName;
        }

        if (parentId && parentName) {
            updateNodeConnections(name, nodes);
            updateNodeConnections(parentName, nodes);

            links.push({
                temp_key: source + "" + target + "" + label,
                source: source,
                target: target,
                value: 1,
                label: label
            });
        }
    });

    var uniqueLinks = d3.nest()
        .key(function (d) {
            return d.temp_key;
        })
        .rollup(function (v) {
            return {source: v[0].source, target: v[0].target, value: v.length, label: v[0].label};
        })
        .entries(links);
    return uniqueLinks.map(d => d.value);
}