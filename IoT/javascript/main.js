// START: loader spinner settings ****************************
var opts = {
    lines: 25, // The number of lines to draw
    length: 15, // The length of each line
    width: 5, // The line thickness
    radius: 25, // The radius of the inner circle
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 2, // Rounds per second
    trail: 50, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};
var target = document.getElementById('loadingSpinner');
var spinner = new Spinner(opts).spin(target);
// END: loader spinner settings ****************************

let
    svgWidth = 1650,
    svgHeight = 1000,
    // svgWidth = mainsvg.style('width').replace('px', ''),
    // svgHeight = mainsvg.style("height").replace('px', ''),
    margin = {top: 40, right: 40, bottom: 40, left: 80, axisx: 40, axisy: 60, storyTop: 40},
    // width = svgWidth - margin.left - margin.right - margin.axisx,
    // height = svgHeight - margin.top - margin.storyTop - margin.axisx - margin.bottom,
    wordStreamHeight = 200,
    wordStreamWidth = width,
    clicked = false,
    links = null,
    storyHeight = authorHeight = commentHeight = (height - wordStreamHeight) / 3,
    authorStartY = 0 + wordStreamHeight,
    authorEndY = authorStartY + authorHeight,
    storyStartY = authorEndY + margin.storyTop,
    storyEndY = storyStartY + storyHeight,
    mainGroup = null,//used to store main group as a global variable later on
    dispatch = d3.dispatch("up", "down");

mainsvg.attr("width", svgWidth).attr("height", svgHeight);
let self = null;
let fileName = "iotdataset";
loadData(fileName);

function loadData(fileName) {
    //Just make sure that we clean the svg.
    mainsvg.selectAll("*").remove();
    mainsvg.attr("viewBox", `0 0 1650 1000`)
        .attr("preserveAspectRatio", "xMinYMid meet");

    // mainsvg.append("g").attr("width", window.outerWidth)
    //     .attr("height", window.outerHeight)
    //     .on("click", removeFocus(mainsvg));

    d3.json("data/" + fileName + ".json", function (error, rawData) {
        self = this;
        if (error) throw error;
        rawData = rawData.filter(d => d.by);

        var minYear = rawData[0].time, maxYear = rawData[0].time;

        rawData.forEach(function (d) {
            if (d.time < minYear) {
                minYear = d.time;
            }
            if (d.time > maxYear) {
                maxYear = d.time;
            }
        });

        var minTime = new Date(minYear * 1000);
        var maxTime = new Date(maxYear * 1000);

        var filters = mainsvg.append("svg")
            .attr("class", "filters");

        var legends = filters
            .append('g')
            .attr("stroke", "#999")
            .attr("transform", "translate(0,100)");

        var sliderContainer = filters.append("g")
            .attr("class", "filter-slider")
            .attr("transform", `translate(55, 250)`);

        var slider = d3.sliderVertical()
            .min(new Date(minTime.getFullYear(), minTime.getMonth(), minTime.getDay()))
            .max(new Date(maxTime.getFullYear(), maxTime.getMonth(), maxTime.getDay()))
            .step(1)
            .default([new Date(maxTime.getFullYear(), maxTime.getMonth(), maxTime.getDay()), new Date(minTime.getFullYear(), minTime.getMonth(), minTime.getDay())])
            .fill('#2196f3')
            .tickFormat(d3.timeFormat('%Y'))
            .height(500)
            .on('end', values => {
                var newData = timeFilter(rawData, values);
                updateNetwork(newData, mainsvg);
            });

        sliderContainer.call(slider);

        legends
            .append('circle')
            .attr("fill", "#7f7f7f")
            .attr('r', 15)
            .attr("cx", 15)
            .attr("cy", 0);

        legends.append('text')
            .text("User")
            .attr("x", 35)
            .attr("y", 7.5);

        legends.append("line")
            .attr("stroke", color("story"))
            .attr("x1", 0)
            .attr("y1", 30)
            .attr("x2", 30)
            .attr("y2", 30)
            .attr("stroke-width", 2);

        legends.append('text')
            .text("story")
            .attr("x", 35)
            .attr("y", 35);

        legends.append("line")
            .attr("stroke", color("ask"))
            .attr("x1", 0)
            .attr("y1", 50)
            .attr("x2", 30)
            .attr("y2", 50)
            .attr("stroke-width", 2);

        legends.append('text')
            .text("ask")
            .attr("x", 35)
            .attr("y", 55);

        legends.append("line")
            .attr("stroke", color("show"))
            .attr("x1", 0)
            .attr("y1", 70)
            .attr("x2", 30)
            .attr("y2", 70)
            .attr("stroke-width", 2);

        legends.append('text')
            .text("show")
            .attr("x", 35)
            .attr("y", 75);

        var toggles = filters.append('g')
            .attr("class", "toggles")
            .attr("stroke", "#999")
            .attr("transform", "translate(0,770)");


        toggles.append("image")
            .attr("id", "toggle-on")
            .attr("href", "image/toggle-on-solid.svg")
            .attr("width", "30px")
            .style("display", "none");

        toggles.append("image")
            .attr("id", "toggle-off")
            .attr("href", "image/toggle-off-solid.svg")
            .attr("width", "30px")
            .style("display", "block");

        toggles.append("text")
            .attr("x", 35)
            .attr("y", 17)
            .attr("id", "toggle-text")
            .text("split");

        toggles.on("click", function () {
            if (toggle) {
                toggles.select("#toggle-on").style("display", "none");
                toggles.select("#toggle-off").style("display", "block");
                toggles.select("#toggle-text").text("split");
                groupNetwork()
            } else {
                toggles.select("#toggle-off").style("display", "none");
                toggles.select("#toggle-on").style("display", "block");
                toggles.select("#toggle-text").text("group");
                splitNetwork()
            }

            toggle = !toggle;
        });


        initialization(mainsvg);

        createNetwork(rawData, mainsvg);
    });
}

function timeFilter(data, values) {
    return data.filter(d => d.time * 1000 <= values[1] && d.time * 1000 >= values[0])
}

function changeDataSet() {
    let sel = document.getElementById("filename");
    let fileName = sel.options[sel.selectedIndex].value;
    loadData(fileName);
}

$(document).click(function () {
   removeFocus(mainsvg)
});