let svgWidth = 1600,
    svgHeight = 1000;

let timeSlider = null;

let margin = {top: 10, right: 10, bottom: 10, left: 10, axisx: 0, axisy: 60, storyTop: 40},
    width = svgWidth - margin.left - margin.right - margin.axisx,
    height = svgHeight - margin.top - margin.storyTop - margin.axisx - margin.bottom;

let center = {x: width / 2, y: height / 2};
let vennCenters = null;
let color = d3.scaleOrdinal(d3.schemeCategory10);

let mainSvg = d3.select("#main-chart");
let filterSvg = d3.select('#filter-svg');
let cloudSvg = d3.select('#cloud-svg');

let nodes = null;
let idToUsername = null;
let links = null;
let userName = null;
let vennToggle = false;
let brushToggle = false;
let brush = null;
let wordStreamData = null;

function wsTimeFilter(wordStreamData, values) {
    return wordStreamData.filter(function (d) {
        let time = new Date(d.date);
        let right = new Date(values[1]).getTime();
        if (time >= values[0] && time <= right) {
            return true;
        }
        return false;
    })
}

function createFilter(rawData, wordStreamData) {
    let minYear = rawData[0].time, maxYear = rawData[0].time;

    rawData.forEach(function (d) {
        if (d.time < minYear) {
            minYear = d.time;
        }
        if (d.time > maxYear) {
            maxYear = d.time;
        }
    });

    let minTime = new Date(minYear * 1000);
    let maxTime = new Date(maxYear * 1000);

    let filters = filterSvg
        .attr("class", "filters");

    let sliderContainer = filters.append("g")
        .attr("class", "filter-slider")
        .attr("transform", `translate(82.5, 10)`);

    timeSlider = d3.sliderHorizontal()
        .min(new Date(minTime.getFullYear(), 0, 0))
        .max(new Date(maxTime.getFullYear() + 1, 0, 1))
        .step(365 * 24 * 60 * 60 * 1000)
        .default([new Date(maxTime.getFullYear() + 1, 0, 0), new Date(minTime.getFullYear(), 0, 0)])
        .fill('#828282')
        .tickFormat(d3.timeFormat('%Y'))
        .width(width - 82.5 * 2)
        .on('end', values => {
            var newData = timeFilter(rawData, values);
            updateData(newData);
            updateChart(newData);

            var newWSData = wsTimeFilter(wordStreamData, values);
            updateWordStreamV2(newWSData);

            turnOffBrush(filterSvg.select(".brush"));
        });

    sliderContainer.call(timeSlider);


    let vennShowToggle = filters.append('g')
        .attr("class", "toggles")
        .attr("stroke", "#999")
        .attr("transform", `translate(${margin.left},70)`);


    vennShowToggle.append("image")
        .attr("id", "toggle-on")
        .attr("href", "image/toggle-on-solid.svg")
        .attr("width", "30px")
        .style("display", "none");

    vennShowToggle.append("image")
        .attr("id", "toggle-off")
        .attr("href", "image/toggle-off-solid.svg")
        .attr("width", "30px")
        .style("display", "block");

    vennShowToggle.append("text")
        .attr("x", 35)
        .attr("y", 17)
        .attr("id", "toggle-text")
        .text("Show Venn-chart");

    hideVenn();

    vennShowToggle.on("click", function () {
        if (vennToggle) {
            vennShowToggle.select("#toggle-on").style("display", "none");
            vennShowToggle.select("#toggle-off").style("display", "block");
            vennShowToggle.select("#toggle-text").text("Show Venn-chart");
            hideVenn()
        } else {
            vennShowToggle.select("#toggle-off").style("display", "none");
            vennShowToggle.select("#toggle-on").style("display", "block");
            vennShowToggle.select("#toggle-text").text("Hide Venn-chart");
            showVenn()
        }
        vennToggle = !vennToggle;
    });


    brush = d3.brush()
        .on("brush", highlightBrushed)
        .on("end", brushFilter);

    let brushShowToggle = filters.append('g')
        .attr("class", "brush")
        .attr("stroke", "#999")
        .attr("transform", `translate(${margin.left + 180},70)`);


    brushShowToggle.append("image")
        .attr("id", "toggle-on")
        .attr("href", "image/toggle-on-solid.svg")
        .attr("width", "30px")
        .style("display", "none");

    brushShowToggle.append("image")
        .attr("id", "toggle-off")
        .attr("href", "image/toggle-off-solid.svg")
        .attr("width", "30px")
        .style("display", "block");

    brushShowToggle.append("text")
        .attr("x", 35)
        .attr("y", 17)
        .attr("id", "toggle-text")
        .text("Turn on brush");

    brushShowToggle.on("click", function () {
        if (brushToggle) {

            turnOffBrush(brushShowToggle);
        } else {

            turnOnBrush(brushShowToggle);
        }
    });
}

function turnOnBrush(brushShowToggle) {
    brushShowToggle.select("#toggle-off").style("display", "none");
    brushShowToggle.select("#toggle-on").style("display", "block");
    brushShowToggle.select("#toggle-text").text("Turn off brush");

    mainSvg.append("g")
        .attr("class", "brush")
        .call(brush);

    brushToggle = !brushToggle;
}

function turnOffBrush(brushShowToggle) {
    brushShowToggle.select("#toggle-on").style("display", "none");
    brushShowToggle.select("#toggle-off").style("display", "block");
    brushShowToggle.select("#toggle-text").text("Turn on brush");

    mainSvg.select(".brush").remove();

    let allNodes = forceSvg.select('.nodes').selectAll('g');
    allNodes.attr("class", "brushed");
    let allLinks = forceSvg.select('.links').selectAll('g');
    allLinks.attr("class", "brushed");

    brushToggle = !brushToggle;
}

function highlightBrushed() {
    if (d3.event.selection != null) {

        let allNodes = forceSvg.select('.nodes').selectAll('g');
        allNodes.attr("class", "non-brushed");
        let allLinks = forceSvg.select('.links').selectAll('g');
        allLinks.attr("class", "non-brushed");

        let brushCoords = d3.brushSelection(this);

        let brushedNodes = allNodes.filter(function (d) {
            let cx = d.x + radiusScale(d.values.length + 10),
                cy = d.y + radiusScale(d.values.length + 10);

            return isBrushed(brushCoords, cx, cy);
        })
            .attr("class", "brushed");

        allLinks.filter(function (d) {
            let temp1 = brushedNodes.data().find(v => d.source.key === v.key);
            let temp2 = brushedNodes.data().find(v => d.target.key === v.key);
            return temp1 && temp2;
        }).attr("class", "brushed");

        if (brushedNodes.data().length === 0) {
            allNodes.attr("class", "brushed");
            allLinks.attr("class", "brushed")
        }
    }
}

function brushFilter() {
    if (!d3.event || !d3.event.selection) return;

    d3.select(this).call(brush.move, null);
    let brushedObject = forceSvg.select('.nodes').selectAll(".brushed");

    let newWordStreamData = [];
    let tempDate = [];

    brushedObject.data().forEach(function (d) {
        wordStreamData.forEach(function (item) {
            if (!tempDate.includes(item.date)) {
                let temp = item.words.user.find(v => v.text === d.key);
                if (temp) {
                    newWordStreamData.push(item);
                    tempDate.push(item.date);
                }
            }
        })
    });

    updateWordStreamV2(newWordStreamData);
}

function isBrushed(brushCoords, cx, cy) {

    let x0 = brushCoords[0][0],
        x1 = brushCoords[1][0],
        y0 = brushCoords[0][1],
        y1 = brushCoords[1][1];

    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function showVenn() {
    mainSvg.select('.venn').attr("visibility", "show");
}

function hideVenn() {
    mainSvg.select('.venn').attr("visibility", "hidden");
}

function createChart(data) {
    mainSvg.selectAll("*").remove();

    mainSvg.attr("width", width)
        .attr("height", 800);

    filterSvg.attr("width", width)
        .attr("height", 100);

    nodes = createNodes(data);
    userName = nodes.map(d => d.key);
    idToUsername = idToUsernameMap();
    links = createLinks(data);

    vennCenters = createVenn(data);

    createForce(vennCenters);

    mainSvg.select(".venn").select('svg').selectAll('g').select('text').style('visibility', 'hidden');
}

function updateChart(data) {
    mainSvg.select(".venn").remove();

    vennCenters = createVenn(data);

    updateNetwork(vennCenters);

    mainSvg.select(".venn").select('svg').selectAll('g').select('text').style('visibility', 'hidden');
    if (!vennToggle) {
        hideVenn()
    }
}


function updateData(data) {
    nodes = createNodes(data);
    userName = nodes.map(d => d.key);
    idToUsername = idToUsernameMap();
    links = createLinks(data);
}

function idToUsernameMap() {
    let map = {};
    nodes.forEach(function (d) {
        d.values.forEach(function (v) {
            map[v.id] = d.key;
        })
    });

    return map;
}

function timeFilter(data, values) {
    return data.filter(d => d.time * 1000 <= values[1] && d.time * 1000 >= values[0])
}

function createNodes(data) {
    return d3.nest().key(d => d.by).entries(data);
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

function createLinks(data) {
    let tempLinks = [];

    data.forEach(function (d) {
        let name = d.by;
        let parentId = d.parent;
        let label = d.label;
        let parentName = idToUsername[parentId];
        let source = '';
        let target = '';

        if (!userName.includes(name) || !userName.includes(parentName)) {
            return;
        }

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

    let uniqueLinks = d3.nest()
        .key(function (d) {
            return d.temp_key;
        })
        .rollup(function (v) {
            return {source: v[0].source, target: v[0].target, value: v.length, label: v[0].label};
        })
        .entries(tempLinks);

    return uniqueLinks.map(d => d.value).filter(d => d.source !== d.target);
}

function createStream(wordStreamData) {
    createWordStreamV2(wordStreamData);
}

// $(document).ready(function () {
//   d3.json('data/alldata_11_9.json', function (err, rawData) {
//     const data = preprocessData(rawData);
//     createChart(data);
//
//     d3.json("data/word_stream_data.json", function (err, wordData) {
//       wordStreamData = wordData;
//       createStream(wordStreamData);
//       createFilter(data, wordStreamData);
//     });
//   });
// });

$(document).ready(function () {
    d3.json("data/word_stream_data.json", function (err, wordData) {
        wordStreamData = wordData;
        createStream(wordStreamData);
        d3.json('data/alldata_11_9.json', function (err, rawData) {
            const data = preprocessData(rawData);
            createChart(data);
            createFilter(data, wordStreamData);
        });
    });
});


function preprocessData(rawData) {
    let uniqueData = [];
    rawData = rawData.filter(d => !d.topic.includes('cps'));
    rawData.forEach(function (d) {
        let item = uniqueData.find(e => e.id === d.id);
        if (!item) {
            d.topic = [d.topic];
            uniqueData.push(d);
        } else {
            item.topic.push(d.topic);
        }
    });

    uniqueData = uniqueData.filter(d => d.by);
    nodes = createNodes(uniqueData);

    nodes = nodes.filter(function (d) {
        return d.values.length >= 10;
    });

    let filtered_data = [];

    nodes.forEach(function (d) {
        d.values.forEach(function (v) {
            let temp = uniqueData.find(x => v.id === x.id);
            if (temp) {
                filtered_data.push(temp);
            }
        })
    });

    return filtered_data;
}
