const tooltip = floatingTooltip("chart-tooltip", 100);
const color = d3.scaleOrdinal(d3.schemeCategory10);
let networksvg = d3.select("#network-svg");
let filtersvg = d3.select("#filter-svg");
let width = 1650,
    height = 800;
console.log(width, height);
let forceStrength = 0.15;
let center = {x: width / 2, y: height / 2};
let simulation = null,
    thicknessScale = null,
    radiusScale = null;
let toggle = false;
let isFocus = false;
let nodes = null, links = null;

function updateDraw(svg, links, thicknessScale, nodes, radiusScale, simulation) {

    let link = svg.select(".links")
        .selectAll("g")
        .data(links, function (d) {
            return d.source.key + "" + d.target.key;
        })
        .attr("transform", `translate(${center.x}, ${center.y})`)
        .attr("stroke", d => color(d.label));

    link.select("line")
        .attr("fill", d => color(d.label))
        .attr("stroke-width", function (d) {
            return thicknessScale(d.value)
        });

    link.exit().remove();

    link.enter()
        .append("g")
        .attr("transform", `translate(${center.x}, ${center.y})`)
        .attr("stroke", d => color(d.label))
        .attr("id", d => d.source.key + d.target.key)
        .append("line")
        .attr("fill", d => color(d.label))
        .attr("stroke-width", function (d) {
            return thicknessScale(d.value)
        });

    let node = svg.select(".nodes")
        .selectAll("g")
        .data(nodes, d => d.key);

    node.select("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", function (d) {
            return radiusScale(d.values.length);
        })
        .attr("fill", function (d) {
            if (d.isAlone) {
                return "#636363";
            }
            return "#b8b8b8";
        });

    node.exit().remove();

    node.enter()
        .append("g")
        .attr("id", d => d.key)
        .append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", function (d) {
            return radiusScale(d.values.length);
        })
        .attr("fill", function (d) {
            if (d.isAlone) {
                return "#636363";
            }
            return "#b8b8b8";
        })
        .call(drag(simulation))
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail)
        .on('click', d => setFocus(svg, d, nodes, links));

    node = svg.select(".nodes")
        .selectAll("g");

    link = svg.select(".links")
        .selectAll("g").select("line");

    return {link, node};
}

function setFocus(svg, d, nodes, links) {
    d3.event.stopPropagation();

    if (isFocus) {
        return;
    }

    const node = svg.select(".nodes");
    const link = svg.select(".links");
    d3.select(this.parentNode).style("opacity", 1);

    const {adjNodes, connectedLinks} = findAdjNodes(d, nodes, links);

    node.selectAll('g')
        .style("opacity", function (d) {
            if (adjNodes.includes(d.key)) {
                return 1;
            }
            return 0.1;
        })
        .select("circle")
        .on("mouseover", null)
        .on("mouseout", null);

    link.selectAll('g').style("opacity", function (d) {
        if (connectedLinks.includes(d.source.key + d.target.key)) {
            return 1;
        }
        return 0.1;
    });

    isFocus = true;

    simulation.stop()
}

function removeFocus(svg) {
    svg.select(".nodes").selectAll("g").style("opacity", 1)
        .select("circle")
        .on("mouseover", showDetail)
        .on("mouseout", hideDetail);
    svg.select(".links").selectAll("g").style("opacity", 1);

    isFocus = false;

    simulation.restart()
}

function findAdjNodes(d, nodes, links) {
    var adjNodes = [d.key];
    var connectedLinks = [];

    nodes.forEach(function (node) {
        links.find(function (link) {

            if ((link.source.key === node.key && link.target.key === d.key) || (link.target.key === node.key && link.source.key === d.key)) {
                adjNodes.push(node.key);
                connectedLinks.push(node.key + d.key);
                connectedLinks.push(d.key + node.key);
                return true;
            }

            return false;
        });
    });

    return {adjNodes, connectedLinks};
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
    removeFocus(svg);

    nodes = createNodes(data);
    const idToUsername = idToUsernameMap(nodes);
    links = createLinks(nodes, data, idToUsername);
    let data_old = svg.select('.nodes').selectAll('g').data();

    let stories = data.filter(d => d.type === "story");
    // loadNewsData(stories, draw);

    // console.log(nodes);
    // console.log(links);

    filterAloneNodes(nodes, links);

    nodes.forEach(d => {
        let temp = data_old.find(e => e.key === d.key);
        if (temp) {
            d.x = temp.x;
            d.y = temp.y;
        }
    });

    simulation.nodes(nodes)
        .force("link", d3.forceLink(links).id(d => d.key).distance(d => d.value).strength(0.2));

    const {link, node} = updateDraw(svg, links, thicknessScale, nodes, radiusScale, simulation);

    simulation.on("tick", function () {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // link.attr("d", function (d) {
        //
        // })

        node
            .attr("transform", function (d) {
                return `translate(${d.x}, ${d.y})`;
            });

        if (simulation.alpha() <= 0.03) {
            simulation.stop()
        }
    });
}

function createNetwork(data, networksvg) {
    var max = -1;

    nodes = createNodes(data);
    const idToUsername = idToUsernameMap(nodes);
    links = createLinks(nodes, data, idToUsername);

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
            return radiusScale(d.values.length + 5);
        })
            .iterations(20))
        .force('x', d3.forceX().strength(forceStrength / 2).x(0))
        .force('y', d3.forceY().strength(forceStrength).y(0))
        .velocityDecay(0.2)
        .alphaTarget(0.4);

    updateNetwork(data, networksvg)
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

function hideDetail() {
    d3.select(this)
        .attr('stroke', function () {
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

    var tempLinks = [];

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

            tempLinks.push({
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
        .entries(tempLinks);
    return uniqueLinks.map(d => d.value).filter(d => d.source !== d.target);
}

function filterAloneNodes(nodes, links) {
    nodes.forEach(function (node) {
        node.isAlone = true;
        var existNode = links.find(function (d) {
            return (node.key === d.source || node.key === d.target);
        });

        if (!existNode) {
            node.isAlone = false;
        }
    })
}

function splitNetwork() {
    simulation
        .force('x', d3.forceX().strength(forceStrength).x(function (d) {
            if (d.isAlone) {
                return -width / 6
            } else {
                return width / 6
            }
        }));

    simulation.alpha(0.5).restart();
}

function groupNetwork() {
    simulation
        .force('x', d3.forceX().strength(forceStrength / 2).x(0));

    simulation.alpha(0.5).restart();
}