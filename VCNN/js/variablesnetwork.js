let width = 800,
    height = 800;
let networkSvg = null, nodes = [], links = [], allLinks = [], linkNodes = [];
let center = {x: width / 2, y: height / 2};
let target_variable = "arrTemperature0";
let isKerasModel = false;
let target_variable_V2 = "data/models_for_stat/arrTemp0_8_8_8_4_100";
let timeStep = 100;
let kerasModel = null;
let kerasWeights = null;
let loadingAll = false;
let pretrainedMode = false;
let circleRadius = 10;
let variables = [
    {id: -1, name: 'allVariables'},
    {id: 0, name: 'arrTemperature0'},
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
let matrixSvg = null;
let selector = d3.select("#target-variables");
let networkRadius = 250;
const tooltip = floatingTooltip("chart-tooltip", 100);
let thicknessScale = d3.scaleSqrt()
    .range([1, 5]);

let options = selector
    .selectAll("option")
    .data(variables)
    .enter()
    .append("option")
    .text(d => d.name);

selector.on("change", function (d) {
    // target_variable = d3.select(this).value();
    target_variable = d3.select(this).node().value;
    console.log(target_variable);
    document.getElementById("contributionFilter").value = "0";
    document.getElementById("weightFilter").value = "0";
    updateInputs();
});

function varNetworkInitialization() {

    networkSvg = d3.select("#network");

    networkSvg.selectAll("*").remove();

    networkSvg
        .attr("width", width)
        .attr("height", height);

    networkSvg.append("svg:defs").selectAll("marker")
        .data(["end"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 18)
        .attr("refY", -1)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .attr("orient", "auto")
        .attr("markerUnits", "userSpaceOnUse")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#5b5b5b");

    networkSvg.append("g")
        .attr("class", "links")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.8);

    networkSvg.append("g")
        .attr("class", "nodes")
        .attr("stroke-width", 1.5);

    networkSvg.append("g")
        .attr("class", "linkNode");


    matrixSvg = d3.select("#networkContainer").select("#matrix")
        .attr("width", 400)
        .attr("height", 400);
}

function createAdjacencyMatrix() {
    var edgeHash = {};
    console.log(links);
    links.forEach(function (d) {
        let id = d.source + "-" + d.target;
        console.log(d.source);
        edgeHash[id] = d;
    });

    let matrix = [];

    nodes.forEach(function (a, idx_a) {
        nodes.forEach(function (b, idx_b) {
            let grid = {id: a.id + "-" + b.id, x: idx_b, y: idx_a, weight: 0};
            if (edgeHash[grid.id]) {
                grid.weight = edgeHash[grid.id].score;
                console.log(edgeHash[grid.id].score);
            }
            matrix.push(grid)
        })
    });


    matrixSvg.append("g")
        .attr("transform", "translate(100,100)")
        .attr("id", "adjacencyG")
        .selectAll("rect")
        .data(matrix)
        .enter()
        .append("rect")
        .attr("width", 25)
        .attr("height", 25)
        .attr("x", function (d) {
            return d.x * 25
        })
        .attr("y", function (d) {
            return d.y * 25
        })
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("fill", "#5b5b5b")
        .style("fill-opacity", function (d) {
            return d.weight * .2
        })
        .on("mouseover", gridOver)
        .on("mouseout", gridLeave);

    var scaleSize = nodes.length * 25;
    var nameScale = d3.scaleBand().domain(nodes.map(d => d.name)).range([0, scaleSize]);

    let xAxis = d3.axisTop().scale(nameScale);
    let yAxis = d3.axisLeft().scale(nameScale);
    matrixSvg.select("#adjacencyG").append("g").call(xAxis).selectAll("text").style("text-anchor", "end").attr("transform", "translate(-10,-10) rotate(90)");
    matrixSvg.select("#adjacencyG").append("g").call(yAxis);

    function gridOver(d) {
        matrixSvg.selectAll("rect").style("stroke-width", function (p) {
            return p.x === d.x || p.y === d.y ? "3px" : "1px";
        })
    }

    function gridLeave() {
        matrixSvg.selectAll("rect").style("stroke-width", function () {
            return "1px";
        })
    }
}

function redrawNetwork() {
    simulation.nodes(nodes);
    simulation.force('link').links(links);

    let node = networkSvg.select(".nodes")
        .selectAll("g")
        .data(nodes, d => d.id);

    node.exit().remove();

    let node_n = node.enter()
        .append("g")
        .attr("id", d => d.id)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on('mouseover', showNodeDetail)
        .on('mouseout', hideNodeDetail)
    // .on('click', nodeSelected);

    node_n.append("text")
        .attr("fill", "#333231")
        .attr("x", 10)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name;
        });

    node_n
        .append("circle")
        .attr("class", "node")
        .attr("r", circleRadius)
        .attr("fill", "#828282")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);


    let {min, max} = getMinMaxScore();
    thicknessScale.domain([min, max]);

    let linkNet = networkSvg.select(".links")
        .selectAll("g")
        .data(links, d => d.source.id + "" + d.target.id);

    linkNet.select("path")
        .attr("stroke-width", d => d.scale * 2);

    linkNet.exit().remove();

    linkNet.enter()
        .append("g")
        .attr("stroke", "#5b5b5b")
        .append("path")
        .attr("fill", "none")
        .attr("stroke-width", d => d.scale * 2)
        .on('mouseover', showLinkDetail)
        .on('mouseout', hideLinkDetail)
        .attr("marker-end", "url(#end)");

    linkNet = networkSvg.select(".links").selectAll("g").select("path");

    let linkNode = networkSvg.select(".linkNode").selectAll(".link-node")
        .data(linkNodes)
        .enter().append("circle")
        .attr("class", "link-node")
        .attr("r", 2)
        .style("fill", "#ccc");

    // let link = networkSvg.select(".links")
    //     .selectAll("g")
    //     .data(links, d => d.source.id + "" + d.target.id);
    //
    // link.select("line")
    //     .attr("stroke-width", /*d => thicknessScale(d.score)*/ 3);
    //
    // link.exit().remove();
    //
    // link.enter()
    //     .append("g")
    //     .attr("stroke", /*d => networkColor(d.target.name)*/ "#828282")
    //     .append("line")
    //     .attr("fill", "none")
    //     .attr("stroke-width", /*d => thicknessScale(d.score)*/ 3)
    //     .on('mouseover', showLinkDetail)
    //     .on('mouseout', hideLinkDetail)
    //     .attr("marker-end", "url(#end)");
    //
    // link = networkSvg.select(".links").selectAll("g").select("line");

    return {node, linkNet, linkNode}
}

function createLinkNode() {
    linkNodes = [];
    links.forEach(function (d) {
        linkNodes.push({
            source: d.source,
            target: d.target
        })
    })
}

function getMinMaxScore() {
    let min = 10000, max = -1;
    links.forEach(function (d) {
        if (d.score > max) {
            max = d.score
        } else if (d.score < min) {
            min = d.score;
        }
    });

    return {min, max};
}

function nodeSelected(d) {
    let tempLinks = links.filter(v => v.target.name === d.name);
    let node_g = networkSvg.select(".nodes");
    node_g.selectAll("g").attr("stroke-opacity", 0.2);
    tempLinks.forEach(function (tempLink) {
        node_g.select(`#${tempLink.source.id}`).attr("stroke-opacity", 1);
    });
}

function showNodeDetail(d) {
    var content =
        '<span class="name">Name: </span><span class="value">' + d.name + '</span><br/>';
    tooltip.showTooltip(content, d3.event);
}

function hideNodeDetail() {
    tooltip.hideTooltip();
}

function showLinkDetail(d) {
    d3.select(this).attr("stroke", "black");

    var content =
        '<span class="name">Input: </span><span class="value">' + d.source.name + '</span><br/>' +
        '<span class="name">Target: </span><span class="value">' + d.target.name + '</span><br/>' +
        '<span class="name">Weight: </span><span class="value">' + d.score + '</span><br/>';
    tooltip.showTooltip(content, d3.event);
}

function hideLinkDetail(d) {
    d3.select(this)
        .attr('stroke', function () {
            return "#828282";
        });

    tooltip.hideTooltip();
}

function calculateNodes() {
    nodes = variables.filter(d => d.id !== -1);

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

function calculateLinks(contributionFilter) {
    if (!contributionFilter) {
        contributionFilter = 0;
    }

    if (isKerasModel) {
        calculateLinksKeras(contributionFilter)
    } else {
        calculateLinksJs(contributionFilter)
    }

}

function calculateLinksJs(contributionFilter) {

    if (!weightsPathData['layer0Weights']) {
        return;
    }

    let weights = weightsPathData['layer0Weights'].lineData;
    let numOfLstmUnits = layersConfig[0].units;
    let minContribution = 1000000;
    let maxContribution = -1;
    let targetVariableId = variables.filter(d => d.id !== -1).find(d => d.name === target_variable).id;

    let varContribution = variables.filter(d => d.id !== -1).map(d => {
        return {id: d.id, name: d.name, score: 0};
    });

    for (let i = 0; i < variables.length - 1; i++) {
        let sum = 0;
        for (let j = 0; j < numOfLstmUnits; j++) {
            let weightIndex = i * 4 * numOfLstmUnits + j * 4;
            sum += Math.abs(weights[weightIndex].weight);
        }
        varContribution[i].score = sum;
        if (sum > maxContribution && i !== targetVariableId) {
            maxContribution = sum;
        } else if (sum < minContribution) {
            minContribution = sum;
        }
    }

    const contributionScale = d3.scaleLinear()
        .range([0.1, 1])
        .domain([minContribution, maxContribution]);

    if (!pretrainedMode) {
        links = []
    }
    //Create links
    // let targetVariableId = variables.filter(d => d.id !== -1).find(d => d.name === target_variable).id;
    varContribution.forEach(function (d) {
        let source = d.id;
        if (d.score > 0 && source !== targetVariableId) {
            let link = links.find(d => d.source === source && d.target === targetVariableId);
            if (link) {
                link.score = d.score;
            } else {
                if (loadingAll) {
                    allLinks.push({
                        source: source,
                        target: targetVariableId,
                        score: d.score,
                        scale: contributionScale(d.score)
                    });
                }
                links.push({
                    source: source,
                    target: targetVariableId,
                    score: d.score,
                    scale: contributionScale(d.score)
                });
            }
        }
    });

    if (pretrainedMode) {
        links = allLinks.filter(d => d.scale >= contributionFilter);
    } else {
        links = links.filter(d => d.scale >= contributionFilter);
    }
}

function calculateLinksKeras(contributionFilter) {

    if (!kerasWeights) {
        return;
    }


    let weights = kerasWeights;
    let numOfLstmUnits = layersConfig[0].units;
    let minContribution = 1000000;
    let maxContribution = -1;

    let targetVariableId = variables.filter(d => d.id !== -1).find(d => d.name === target_variable).id;

    let varContribution = variables.filter(d => d.id !== -1).map(d => {
        return {id: d.id, name: d.name, score: 0};
    });

    for (let i = 0; i < variables.length - 1; i++) {
        let sum = 0;
        for (let j = 0; j < numOfLstmUnits; j++) {
            let weightIndex = i * 4 * numOfLstmUnits + j;
            sum += Math.abs(weights[weightIndex]);
        }
        varContribution[i].score = sum;
        if (sum > maxContribution && i !== targetVariableId) {
            maxContribution = sum;
        } else if (sum < minContribution) {
            minContribution = sum;
        }
    }

    console.log("filter", contributionFilter);
    console.log(minContribution, maxContribution);

    const contributionScale = d3.scaleLinear()
        .range([0.1, 1])
        .domain([minContribution, maxContribution]);


    if (!pretrainedMode) {
        links = []
    }
    //Create links
    varContribution.forEach(function (d) {
        let source = d.id;
        if (d.score > 0 && source !== targetVariableId) {
            let link = links.find(d => d.source === source && d.target === targetVariableId);
            if (link) {
                link.score = d.score;
            } else {
                if (loadingAll) {
                    allLinks.push({
                        source: source,
                        target: targetVariableId,
                        score: d.score,
                        scale: contributionScale(d.score)
                    });
                }
                links.push({
                    source: source,
                    target: targetVariableId,
                    score: d.score,
                    scale: contributionScale(d.score)
                });
            }
        }
    });


    if (pretrainedMode) {
        links = allLinks.filter(d => d.scale >= contributionFilter);
    } else {
        links = links.filter(d => d.scale >= contributionFilter);
    }

    console.log(links)
}

function dragstarted(d) {
    if (!d3.event.active) simulation.alpha(1).alphaTarget(0.1).restart();
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

function updateVarNetwork(contributionFilter) {
    calculateLinks(contributionFilter);
    createAdjacencyMatrix();


    let {node, linkNet, linkNode} = redrawNetwork();

    createLinkNode();

    simulation
        .on("tick", function () {
            node
                .attr("transform", function (d) {
                    d.x = Math.max(circleRadius, Math.min(width - circleRadius, d.x));
                    d.y = Math.max(circleRadius, Math.min(height - circleRadius, d.y));
                    return `translate(${d.x}, ${d.y})`;
                });

            linkNet
                .attr("d", function (d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,
                        dr = Math.sqrt(dx * dx + dy * dy);
                    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                });
        });
    if (target_variable === variables[variables.length - 1].name) {
        loadingAll = false;
    }

    simulation.alpha(1).restart();
}

function createVarNetwork() {
    varNetworkInitialization();

    simulation = d3.forceSimulation()
        .force('link', d3.forceLink().distance(150).strength(0.3))
        .force('charge', d3.forceManyBody().distanceMin(100).distanceMax(200).strength(-400))
        .force('collision', d3.forceCollide().strength(1))
        // .force("center", d3.forceCenter(center.x, center.y))
        .force("x", d3.forceX().strength(0.01).x(center.x))
        .force("y", d3.forceY().strength(0.01).y(center.y))
        .alphaDecay(0.01)
        .alphaTarget(0.1);

    calculateNodes();

    updateVarNetwork();
}

function changeContributionFilter() {
    let contributionFilter = +$('#contributionFilter').val();

    updateVarNetwork(contributionFilter);
}

