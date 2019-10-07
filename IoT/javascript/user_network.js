function createNetwork(data, mainsvg) {
    let width = 1650,
        height = 1000;
    let forceStrength = 0.3;
    let center = {x: width/2, y: height/2}

    var packLayout = d3.pack();
    packLayout.size([width, height]);

    const nodes = createNodes(data);
    const idToUsername = idToUsernameMap(nodes);
    const links = createLinks(nodes, data, idToUsername);

    console.log(nodes);
    console.log(links);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.key))
        .force("charge", d3.forceManyBody())
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .velocityDecay(0.2)
        .alphaTarget(0.1);

    const svg = mainsvg;

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", d => 2*Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill", "#000000")
        .call(drag(simulation));

    node.append("title")
        .text(d => d.key);

    simulation.on("tick", function () {
       link.attr("x1", d => d.source.x)
           .attr("y1", d => d.source.y)
           .attr("x2", d => d.target.x)
           .attr("y2", d => d.target.y);

       node.attr("cx", d => d.x)
           .attr("cy", d => d.y);
    });
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
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

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

function createLinks(nodes, data, idToUsername) {

    var links = [];

    data.forEach(function (d) {
        var name = d.by;
        var currnetId = d.id;
        var parentId = d.parent;
        var parentName = idToUsername[parentId];

        if (parentId && parentName) {
            links.push({temp_key: currnetId + "" + parentId, source: name, target: parentName, value: 1});
        }
    });

    var uniqueLinks = d3.nest()
        .key(d => d.temp_key)
        .rollup(function (v) {
            return {source: v[0].source, target: v[0].target, value: v.length};
        })
        .entries(links);
    return uniqueLinks.map(d => d.value);
}