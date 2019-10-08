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

let mainsvg = d3.select("#mainsvg"),
    // svgWidth = 1650,
    // svgHeight = 1000,
    svgWidth = mainsvg.style('width').replace('px', ''),
    svgHeight = mainsvg.style("height").replace('px', ''),
    margin = {top: 40, right: 40, bottom: 40, left: 80, axisx: 40, axisy: 60, storyTop: 40},
    width = svgWidth - margin.left - margin.right - margin.axisx,
    height = svgHeight - margin.top - margin.storyTop - margin.axisx - margin.bottom,
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
function loadData(fileName){
    //Just make sure that we clean the svg.
    mainsvg.selectAll("*").remove();
    // mainsvg.attr("transform", `translate()`);
    d3.json("data/"+fileName+".json", function (error, rawData) {
        self = this;
        if (error) throw error;
        rawData = rawData.filter(d => d.by);
        console.log(rawData);
        createNetwork(rawData, mainsvg);
    });
}
function changeDataSet(){
    let sel = document.getElementById("filename");
    let fileName = sel.options[sel.selectedIndex].value;
    loadData(fileName);
}