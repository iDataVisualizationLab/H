let width = 800,
  height = 200;
let X_train, y_train, X_test, y_test;
let model_params = {};

let paramSvg = null,
  chartSvg = null;

let chartYScale = d3.scaleLinear()
  .range([height, 0]);

let chartXScale = d3.scaleLinear()
  .range([0, width])
  .domain([0, 500]);

let variables = null;

function initialization() {
  paramSvg = d3.select("#param");
  chartSvg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

  createParam();
}

function createParam() {
  variables = ['arrTemperature0', 'arrTemperature1', 'arrTemperature2', 'arrCPU_load0', 'arrMemory_usage0', 'arrFans_health0', 'arrFans_health1', 'arrFans_health2', 'arrFans_health3', 'arrPower_usage0', "All Targets"];

  paramSvg.select("#target-variables")
    .selectAll("option")
    .data(variables)
    .enter()
    .append("option")
    .text(d => d)

}

initialization();

function loadDataAndTrain() {
  d3.json("data/allData/" + target_variable + "_target_X_train_HPCC_1_20.json").then(X_train_r => {
    d3.json("data/allData/" + target_variable + "_target_y_train_HPCC_1_20.json").then(y_train_r => {
      d3.json("data/allData/" + target_variable + "_target_X_test_HPCC_1_20.json").then(X_test_r => {
        d3.json("data/allData/" + target_variable + "_target_y_test_HPCC_1_20.json").then(y_test_r => {
          X_train = X_train_r;
          y_train = y_train_r;
          X_test = X_test_r;
          y_test = y_test_r;
          startTraining()
        });
      });
    });
  });
}


$(document).ready(function () {
  $("#train-btn").on("click", function () {
    target_variable = paramSvg.select("#target-variables").property("value");
    console.log(target_variable);
    loadDataAndTrain();
  })
});

function createLossChart() {
  chartSvg.selec
}
