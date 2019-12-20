const dispatch = d3.dispatch("start", "pause", "change", "save", "changeInput", "changeWeightFilter");
let btnTrain = null;
let mapObjects = {};
let currentModel = null;
const lstmWeightTypes = ["(click to toggle)", "input gate", "forget gate", "cell state", "output gate"];
const lstmWeightTypeDisplay = [0, 0, 0, 1];
const weightTypeDisplay = [1, 1];
let isTraining = false;
let trainLosses;
let testLosses;
let reviewMode = false;
//Draw color scales
const colorBarW = 100;
const colorBarH = 10;
const heatmapH = 100;
const maxLineWeightOpacity = 1.0;
const minLineWeightOpacity = 0.0;
let predictedVariable;
let dataItemName = "Date entries";
let features;
let selectedFeatures;
let defaultModelIndex = 1;
const trainTestLossColorScheme = ["#a0a0a0", "#f5008c", "#0877bd"];//Used for train tess loss graph.
const testOutputColorScheme = ["#f5008c", "#6a8759", "#f5008c", "#0877bd"];//Used for the test output color scheme
const outputColorScheme = ["#a8aaab", "#6a8759", "#0877bd"];//Used for training output and also immediate layer training output
let trainingProcess = [];
let noOfEpochs = 30;
let noOfBatches = 39;
let minDataVal = null;
let maxDataVal = null;
let networkHeight = null;
let neuronHeight = 122;
let trainingWeightWidthRatio = 129.125/200;//3 / 8;
let neuronShowingHeatmap = false;
let isOutlierGlobal = [];
let neuronData = {unordered: {}, mse: {}, correlation: {}, weights: {}};
let originalNeurons = {};
let originalTrainingWeights = null;
let originalWeights = null;


document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, options);
});
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, options);
});

$(document).ready(function(){
    $('.sidenav').sidenav();
    $('select').formSelect();

});

