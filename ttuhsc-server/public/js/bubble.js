function createBubblesChart() {
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    let width = null, height = null;
    let center = null;
    let forceStrength = 0.04;
    let bubbles = null, svg = null;
    let clusters = {};
    let simulation = null;

    svg = d3.select("#main-chart").append("svg")
        .attr("class", "bubble-chart");

    width = +svg.style('width').replace('px', '');
    height = +svg.style('height').replace('px', '');

    center = {x: width / 2, y: height / 2};

    var chart = function (data) {
        createCluster(data);

        let defs = svg.append("defs");

        defs.selectAll("pattern")
            .data(data)
            .enter()
            .append("pattern")
            .attr("id", d => d.name.replace(" ", "").split(",")[0])
            .attr("width", 1)
            .attr("height", 1)
            .attr("patternContentUnits", "objectBoundingBox")
            .append("image")
            .attr("xlink:href", d => "img/" + d.name.split(",")[0] + ".png")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1)
            .attr("height", 1)
            .attr("preserveAspectRatio", "xMinYMin slice");

        let nodes = createNodes(data);

        bubbles = svg.selectAll(".bubble-container")
            .data(nodes)
            .enter()
            .append('g')
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        let bubblesE = bubbles.append('circle')
            .classed('bubble', true)
            .attr('r', d => d.radius)
            .attr('fill', function (d) {
                return "url(\"#" + d.name.replace(" ", "") + "\")";
            })
            .attr('stroke', function (d) {
                return color(d.data.institution);
            });

        bubbles.merge(bubblesE);

        bubbles.transition(2000)
            .attr('r', d => d.radius);

        simulation = d3.forceSimulation()
            .velocityDecay(0.2)
            .force('x', d3.forceX().strength(forceStrength).x(center.x))
            .force('y', d3.forceY().strength(forceStrength).y(center.y))
            .force('charge', d3.forceManyBody().strength(charge))
            .force('collision', d3.forceCollide().radius(function (d) {
                return d.radius
            }))
            .alphaTarget(0.1)
            .on('tick', ticked);

        simulation.nodes(nodes);
        groupBubbles();
    };


    function splitBubbles() {
        var clusterArr = Object.keys(clusters);

        createMultilineText(clusterArr);

        simulation.force('x', d3.forceX().strength(forceStrength).x(d => clusters[d.data.institution].x));
        simulation.alpha(1).restart();
    }

    function ticked() {
        bubbles.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }


    function groupBubbles() {
        svg.selectAll('.cluster').remove();

        simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));
        simulation.alpha(1).restart();
    }

    function createNodes(data) {
        var nodes = data.map(function (d) {
            return {
                radius: 20,
                value: 1,
                name: d.name.split(",", 1)[0],
                data: d,
                x: Math.random() * 900,
                y: Math.random() * 900
            };
        });
        nodes.sort(function (a, b) {
            return b.value - a.value;
        });

        return nodes;
    }

    function showDetail(d) {
        d3.select(this).attr("stroke", "black");

        var content = '<span class="name">Name: </span><span class="value">' +
            d.name +
            '</span><br/>' +
            '<span class="name">Title: </span><span class="value">$' +
            d.title +
            '</span><br/>' +
            '<span class="name">Institution: </span><span class="value">' +
            d.institution +
            '</span><br/>' +
            '<span class="name">Email: </span><span class="value">' +
            d.email +
            '</span><br/>' +
            '<span class="name">Phone: </span><span class="value">' +
            d.phone +
            '</span>';
    }

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
        if (!d3.event.active) simulation.alphaTarget(0.3);
        d.fx = null;
        d.fy = null;
    }

    function createCluster(data) {
        var clusterName = [];
        data.forEach(function (d) {
            if (!clusterName.includes(d.institution)) {
                clusterName.push(d.institution)
            }
        });

        let numOfClusters = clusterName.length;
        let distance = width / (numOfClusters + 1);
        for (var i = 0; i < numOfClusters; i++) {
            clusters[clusterName[i]] = {x: distance * (i + 1), y: height / 2}
        }
    }

    chart.toggleDisplay = function (displayName) {
        if (displayName === 'group-all') groupBubbles();
        else splitBubbles();
    };

    function createMultilineText(clusterArr) {
        var texts = svg.selectAll('text').data(clusterArr)
            .enter()
            .append('text')
            .attr('class', 'cluster')
            .attr('x', d => clusters[d].x)
            .attr('y', d => clusters[d].y / 5)
            .attr('text-anchor', 'middle')
            .style('fill', d => color(d))
            .text(d => d);

        var width = 200;

        texts.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+|\//).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                x = text.attr("x"),
                y = text.attr("y"),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
                }
            }
        });
    }

    return chart
}

var bubbleChart = createBubblesChart();

$(document).ready(function () {
    let filter = d3.select('.chart-container').append("div")
        .attr("class", "filter-button");

    filter.append('button').attr("class", "group-button").attr('id', 'group-all').text("All profile");
    filter.append('button').attr("class", "group-button").attr('id', 'group-institution').text("Group by institution");

    filter.selectAll('.group-button')
        .on('click', function () {
            d3.selectAll('.group-button').classed('active', false);

            var button = d3.select(this);

            button.classed('active', true);
            var displayName = button.attr('id');

            bubbleChart.toggleDisplay(displayName)
        });

    $.ajax({
        url: 'http://localhost:3000/api/profile/all',
        success: function (data) {
            bubbleChart(data.data);
        },
        dataType: 'json'
    });
});