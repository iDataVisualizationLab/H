let width = 600,
    height = 600;
let networkSvg = null, nodes = [], links = [];
let center = {x: width / 2, y: height / 2}, bilinks = [];
let target_variable = "arrTemperature0";
let variables = [{id: 0, name: 'arrTemperature0'},
    {id: 1, name: 'arrTemperature1'},
    {id: 2, name: 'arrTemperature2'},
    {id: 3, name: 'arrCPU_load0'},
    {id: 4, name: 'arrMemory_usage0'},
    {id: 5, name: 'arrFans_health0'},
    {id: 6, name: 'arrFans_health1'},
    {id: 7, name: 'arrFans_health2'},
    {id: 8, name: 'arrFans_health3'},
    {id: 9, name: 'arrPower_usage0'}];
let simulation = null;
let network;
let selector = d3.select("#target-variables");
let networkRadius = 250;
const tooltip = floatingTooltip("chart-tooltip", 100);
let networkColor = d3.scaleOrdinal(d3.schemeCategory10);
let thicknessScale = d3.scaleSqrt()
    .range([1, 3]);


let options = selector
    .selectAll("option")
    .data(variables)
    .enter()
    .append("option")
    .text(d => d.name);

selector.on("change", function (d) {
    // target_variable = d3.select(this).value();
    target_variable = d3.select(this).node().value;
    updateInputs();
});

function varNetworkInitialization() {

    networkSvg = d3.select("#network")
        .attr("width", width)
        .attr("height", height);

    networkSvg.append("g")
        .attr("class", "links")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.8);

    networkSvg.append("g")
        .attr("class", "nodes")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
}

function redrawNetwork() {
    simulation.nodes(nodes);
    simulation.force('link').links(links);

    let node = networkSvg.select(".nodes")
        .selectAll("g")
        .data(nodes, d => d.id)
        .enter()
        .append("g")
        .attr("stroke", "#828282");

    node
        .append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .attr("id", d => d.name)
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail);

    let link = networkSvg.select(".links")
        .selectAll("g")
        .data(links, d => d.source.id + "" + d.target.id);

    // link.select("line")
    //     .attr("stroke-width", d => d.score * 5);
    //
    // link.exit().remove();
    //
    // link.enter()
    //     .append("g")
    //     .attr("stroke", d => networkColor(d.target.name))
    //     .append("line")
    //     .attr("fill", d => networkColor(d.target.name))
    //     .attr("stroke-width", d => d.score * 5);
    //
    // link = networkSvg.select(".links").selectAll("g").select("line");


    link.select("path")
        .attr("stroke-width", d => d.score * 5);

    link.exit().remove();

    link.enter()
        .append("g")
        .attr("stroke", d => networkColor(d.target.name))
        .append("path")
        .attr("fill", "none")
        .attr("stroke-width", d => thicknessScale(d.score));

    link = networkSvg.select(".links").selectAll("g").select("path");


    return {node, link}
}

function showDetail(d) {
    d3.select(this).attr("stroke", "black");

    var content =
        '<span class="name">Name: </span><span class="value">' + d.name + '</span><br/>';
    tooltip.showTooltip(content, d3.event);
}

function hideDetail() {
    d3.select(this)
        .attr('stroke', function () {
            return "#ffffff";
        });

    tooltip.hideTooltip();
}

function calculateNodes() {
    nodes = variables;

    let deltaAngle = 360 / nodes.length;

    nodes.forEach(function (d, i) {
        let angle = deltaAngle * i;
        let piAngle = angle / 360 * 2 * Math.PI;
        let deltaY = networkRadius * Math.sin(piAngle);
        let deltaX = networkRadius * Math.cos(piAngle);

        d['x'] = center.x - deltaX;
        d['y'] = center.y - deltaY;
    });
}

function calculateLinks() {
    if (!weightsPathData['layer0Weights']) {
        return;
    }


    let weights = weightsPathData['layer0Weights'].lineData;
    let numOfLstmLayer = 4;

    let varContribution = variables.map(d => {
        return {id: d.id, name: d.name, score: 0};
    });

    for (let i = 0; i < variables.length; i++) {
        let sum = 0;
        for (let j = 0; j < numOfLstmLayer; j++) {
            let weightIndex = i * 4 * numOfLstmLayer + j * numOfLstmLayer;
            if (weights[weightIndex].scaledWeight >= 0.5) {
                sum += Math.abs(weights[weightIndex].weight);
            }
        }
        varContribution[i].score = sum;
    }

    //Create links
    if (isTraining)
        links = [];
    let targetVariableId = variables.find(d => d.name === target_variable).id;
    varContribution.forEach(function (d) {
        let source = d.id;
        if (d.score > 0)
            links.push({source: source, target: targetVariableId, score: d.score});
    });
}

function updateVarNetwork() {
    calculateLinks();

    let {node, link} = redrawNetwork();

    simulation
        .on("tick", function () {
            // link
            //     .attr("x1", d => d.source.x)
            //     .attr("y1", d => d.source.y)
            //     .attr("x2", d => d.target.x)
            //     .attr("y2", d => d.target.y);

            link
                .attr("d", function (d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,
                        dr = Math.sqrt(dx * dx + dy * dy);
                    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                });

            node
                .attr("transform", function (d) {
                    return `translate(${d.x}, ${d.y})`;
                });
        });
}

function createVarNetwork() {
    varNetworkInitialization();

    simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(1))
        .force('link', d3.forceLink().distance(10).strength(0))
        .force('collision', d3.forceCollide().radius(10))
        .force('x', d3.forceX(1).x(d => d.x))
        .force('y', d3.forceY(1).y(d => d.y))
        .alphaTarget(1);

    calculateNodes();

    updateVarNetwork();
}


