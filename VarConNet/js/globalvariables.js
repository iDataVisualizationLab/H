const dispatch = d3.dispatch("start", "pause", "change", "save", "changeInput", "changeWeightFilter");
let btnTrain = null;
let mapObjects = {};
let currentModel = null;
const lstmWeightTypes = ["(click to toggle)", "input gate", "forget gate", "cell state", "output gate"];
const lstmWeightTypeDisplay = [1, 0, 0, 0];
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
let dataItemName = "Data items";
let features;
let selectedFeatures;
let defaultModelIndex = 1;
const trainTestLossColorScheme = ["#a0a0a0", "#f5008c", "#0877bd"];//Used for train tess loss graph.
const testOutputColorScheme = ["#a8aaab", "#f5008c", "#0877bd"];//Used for the test output color scheme
const outputColorScheme = ["#a8aaab", "#6a8759", "#0877bd"];//Used for training output and also immediate layer training output