let width = 800,
  height = 800;

let paramSvg = null,
  chartSvg = null;

let variables = null;

function initialization() {
  paramSvg = d3.select("#param");
  chartSvg = d3.select("#chart");

  createParam();
}

function createParam() {
  variables = ['arrTemperature0', 'arrTemperature1', 'arrTemperature2', 'arrCPU_load0', 'arrMemory_usage0', 'arrFans_health0', 'arrFans_health1', 'arrFans_health2', 'arrFans_health3', 'arrPower_usage0'];

  paramSvg.select("#target-variables")
    .selectAll("option")
    .data(variables)
    .enter()
    .append("option")
    .text(d => {console.log(d); return d;})

}

initialization()
