let width = 800,
    height = 800;

let variables = null;
let target_variable = "arrTemperature0";

function initialization() {
    createParam();
}

function createParam() {
    variables = ['arrTemperature0', 'arrTemperature1', 'arrTemperature2', 'arrCPU_load0', 'arrMemory_usage0', 'arrFans_health0', 'arrFans_health1', 'arrFans_health2', 'arrFans_health3', 'arrPower_usage0'];

    let targetVariable = d3.select("#target-variables");

    targetVariable
        .selectAll("option")
        .data(variables)
        .enter()
        .append("option")
        .text(d => d)

    targetVariable
        .on("change", function (d) {
            target_variable = d3.select(this).property('value');
            updateInputs();
        })
}

initialization();