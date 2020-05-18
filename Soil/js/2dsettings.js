let svgId = "#corcoefGraph";
let boxPlotData = [];
let curvePlotData = [];
let opacitySliders = [];
let adjustedRSquaredScores = [0, 0];
let sliderHeight = 24;
let sliderWidth = 140;
let sliderMarginRight = 20;

let plotMargins = {
    l: 20,
    r: 80,
    t: 50,
    b: 30,
    pad: 0,
    autoexpand: false
};

let graphNodeRadius = 12;
let mouseOverExpand = 6;
let selectionStrokeWidth = 3;
let force;
let maxLinkWidth = 2;
let minLinkWidth = 0.5;

let nodes_data = [];
let links_data = [];
let node;
let link;
let defaultThreshold = 0.75;
let linkStrengthPower = 10;
let selectionCounter = 0;
let selectionCircle;
let defaultMargin = 20;
