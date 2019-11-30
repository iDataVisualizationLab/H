let trainRULOrder;
let testRULOrder;
let X_train, y_train, X_test, y_test;
let X_trainOrg, y_trainOrg, X_testOrig, y_testOrig;
let trainStartTime = null;
let link = d3.linkHorizontal()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    });

// createVarNetwork();

function updateInputs() {
    if (target_variable === "allVariables") {
        loadingAll = true;
        pretrainedMode = true;
        target_variable = "arrTemperature0";
    } else {
        pretrainedMode = false;
        loadingAll = false;
    }

    processInputs().then(() => {
        //Create default layersConfig.
        createDefaultLayers();
        createTrainingGUI(layersConfig).then(() => {
            // if (pretrainedMode) {
            //     loadAllVariablesModel();
            // } else {
            //     // loadAllPretrainModelFromServer("new_arrTemperature0_100_process");
            //     loadAllPretrainModelFromServer("arrTemp0_ts100_e10_process");
            // }
            // loadAllPretrainModelFromServerV2(target_variable_V2);
        });
    });
}

updateInputs();

async function loadAllVariablesModel() {
    for (const d of variables.filter(d => d.id !== -1).map(d => d.name)) {
        // await loadAllPretrainModelFromServer(d);
        target_variable = d;
        console.log(target_variable);
        await loadAllPretrainKerasModelFromServer(d);
    }
}

function loadDefaultModel() {
    //Load default model.
    let theModelFromServerOptions = document.getElementById("modelsFromServer");
    theModelFromServerOptions.selectedIndex = defaultModelIndex;
    theModelFromServerOptions.onchange(theModelFromServerOptions);
}

function populateFeatureSelection(features) {
    let cbxFeatures = $('#features');
    d3.select("#features").selectAll("*").remove();
    features.forEach((f, i) => {
        cbxFeatures.append($(` <div class="input-field col s4"><label><input type="checkbox" class="filled-in" id="feature${i}" checked/><span>${f}</span></label></div>`));
    });
}

function configInput() {
    dispatch.call("change", null, undefined); //Pause training first.
}

function selectFeatures() {
    //TODO: Check there is change or not.
    for (let i = 0; i < features.length; i++) {
        selectedFeatures[i] = $("#feature" + i).is(":checked");
    }
    dispatch.call("changeInput", null, undefined);
}

function copyFeatures(X, selectedFeatures) {
    return X.map(itemSequence => {
        return itemSequence.map(step => {
            let fs = [];
            selectedFeatures.forEach((sf, i) => {
                if (sf) {
                    fs.push(step[i]);
                }
            });
            return fs;
        });
    });
}

function processData(X_trainR, y_trainR, X_testR, y_testR, resolve) {
    X_train = X_trainR;
    X_test = X_testR;
    y_train = y_trainR;
    y_test = y_testR;
    //We build the sorting order.
    trainRULOrder = Array.from(y_train, (val, i) => i);
    trainRULOrder = trainRULOrder.sort((a, b) => y_train[a] - y_train[b]);
    testRULOrder = Array.from(y_test, (val, i) => i);
    testRULOrder = testRULOrder.sort((a, b) => y_test[a] - y_test[b]);
    let flattenedZ = X_train.flat().flat();
    let minZ = d3.min(flattenedZ);
    let maxZ = d3.max(flattenedZ);
    let avgZ = (maxZ - minZ) / 2 + minZ;

    minDataVal = minZ;
    maxDataVal = maxZ;

    // if (Math.abs(maxZ) >= Math.abs(minZ)) {
    //     minDataVal = -Math.abs(maxZ)
    // } else {
    //     maxDataVal = Math.abs(minZ);
    // }

    drawInputColorScale(minDataVal, avgZ, maxDataVal);
    drawOutputColorScale();
    //Draw input
    let X_train_ordered = trainRULOrder.map(d => X_train[d]);
    X_train_ordered.layerName = "Input";

    drawHeatmaps(X_train_ordered, "inputContainer", "inputDiv", -1, true).then(() => {
        hideLoader();
    });
    //Draw sample input for documentation.
    //Generate one sample output
    let noOfItems = X_train_ordered.length;
    let noOfSteps = X_train_ordered[0].length;
    //Generate steps
    let x = Array.from(Array(noOfSteps), (x, i) => i);
    //Generate items
    let y = Array.from(Array(noOfItems), (x, i) => i);
    let z = [];
    for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
        let row = [];
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            row.push(X_train_ordered[itemIdx][stepIdx][0])
        }
        z.push(row);
    }
    // drawSampleInputOutput({x: x, y: y, z: z}, "Sample input sensor", "sampleInput");
    let y_train_ordered = trainRULOrder.map(v => y_train[v][0]).reverse();
    let sampleY = y_train_ordered.map(rulVal => Math.round(rulVal + 30.0 * (Math.random() - 0.5)));

    const lineChartData = [
        {
            x: sampleY,
            y: y,
            series: 'output',
            marker: 'o',
            type: 'scatter'
        },
        {
            x: y_train_ordered,
            y: y,
            series: 'target',
            marker: 'x',
            type: 'scatter'
        }
    ];
    // drawSampleOutput(lineChartData, "Target vs. output RUL", "trainRUL");
    resolve();
}

//TODO: Since we load the default models => this might not be needed => but there are few dataset specific information that we need to save/load before by passing this. So check again.
async function processInputs(sFs) {
    return new Promise(resolve => {
        // d3.json("data/train_FD001_100x50.json").then(X_trainR => {
        //     d3.json("data/train_RUL_FD001_100x50.json").then(y_trainR => {
        //         d3.json("data/test_FD001_100x50.json").then(X_testR => {
        //             d3.json("data/test_RUL_FD001_100x50.json").then(y_testR => {
        //                 features = [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21].map(ss => "sensor" + ss);
        //                 predictedVariable = "RUL";
        //                 dataItemName = "Engines";
        // d3.json("data/newData/" + target_variable + "_target_X_train_HPCC_" + timeStep + ".json").then(X_trainR => {
        //     d3.json("data/newData/" + target_variable + "_target_y_train_HPCC_" + timeStep + ".json").then(y_trainR => {
        //         d3.json("data/newData/" + target_variable + "_target_X_test_HPCC_" + timeStep + ".json").then(X_testR => {
        //             d3.json("data/newData/" + target_variable + "_target_y_test_HPCC_" + timeStep + ".json").then(y_testR => {
        d3.json("data/newData/X_train_HPCC_1_20_testsplitter.json").then(X_trainR => {
            d3.json("data/newData/y_train_HPCC_1_20_testsplitter.json").then(y_trainR => {
                d3.json("data/newData/X_test_HPCC_1_20_testsplitter.json").then(X_testR => {
                    d3.json("data/newData/y_test_HPCC_1_20_testsplitter.json").then(y_testR => {
                        features = ['arrTemperature0', 'arrTemperature1', 'arrTemperature2', 'arrCPU_load0', 'arrMemory_usage0', 'arrFans_health0', 'arrFans_health1', 'arrFans_health2', 'arrFans_health3', 'arrPower_usage0'];
                        predictedVariable = target_variable;
                        dataItemName = "Data Entries";
                        populateFeatureSelection(features);
                        if (!sFs) {
                            selectedFeatures = features.map(_ => true);
                        } else {
                            selectedFeatures = sFs;
                        }
                        //TODO: These for testing the models.
                        // selectedFeatures = [2, false, 4, 6, 7, false, 9, false, 12, 13, false, false, 17, false, false]; // for 8_8884
                        // selectedFeatures = [false, 3, false, false, false, 8, false, 11, false, false, 14, 15, false, 20, 21];
                        X_train = copyFeatures(X_trainR, selectedFeatures);
                        X_test = copyFeatures(X_testR, selectedFeatures);
                        processData(X_train, y_trainR, X_test, y_testR, resolve);
                    });
                });
            });
        });
    });
}

async function drawColorScales(modelsConfig) {
    return new Promise(() => {
        for (let i = 0; i < modelsConfig.length - 1; i++) {//Except for the last one
            let layer = modelsConfig[i];
            let timeStamp = layer.timeStamp;
            let containerId = `colorScale${timeStamp}`;
            if (layer.layerType === "lstm") {
                drawLSTMColorScale(containerId, colorBarW, colorBarH);
            } else if (layer.layerType === "dense") {
                drawDenseColorScale(containerId);
            }
        }
    });
}

async function drawDenseColorScale(containerId) {
    return new Promise(() => {
        let theG = d3.select("#" + containerId);
        theG.selectAll("text").data([{text: " x : target", color: "darkgreen"}, {
            text: " o : output",
            color: "gray"
        }]).join("text")
            .text(d => d.text)
            .attr("fill", d => d.color)
            .attr("x", (d, i) => i * 100)
            .attr("y", colorBarH);
    });
}

async function drawLSTMColorScale(containerId, width, height) {
    let lstm1ColorScale = d3.scaleSequential()
        .interpolator(d3.interpolateTurbo)
        .domain([-1, 1]) //Change when using another activation function
        .clamp(true);
    plotColorBar(d3.select("#" + containerId), lstm1ColorScale, containerId, width, height, "horizon");
}

async function drawInputColorScale(minZ, avgZ, maxZ) {
    return new Promise(() => {
        let inputColorScale = d3.scaleSequential()
            .domain([minZ, maxZ])
            .interpolator(d3.interpolateTurbo)
            .clamp(true);
        d3.select("#inputColorScale").selectAll("*").remove();
        plotColorBar(d3.select("#inputColorScale"), inputColorScale, "inputColorBar", colorBarW, colorBarH, "horizon");
    });
}

async function drawOutputColorScale() {
    drawDenseColorScale("outputColorScale");
}

async function createTrainingGUI(layersConfig) {
    // if (layersConfig.length === 0) {
    //     createDefaultLayers();
    // }
    layersConfig.forEach(layerInfo => {
        if (layerInfo.id !== "output" && layerInfo.layerType !== "flatten") {
            networkHeight = calculateNetworkHeight();
            createLayerGUI(layerInfo);
        }
    });
}

function startTraining() {
    trainStartTime = new Date();
    let epochs = +$("#epochs").val();
    let batchSize = +$("#batchSize").val();
    let learningRate = +$("#learningRate").val();

    const inputShape = [X_train[0].length, X_train[0][0].length];

    //Toggle
    setTrainingConfigEditable(false);
    isTraining = true;
    showLoader();
    if (currentModel === null) {
        createModel(layersConfig, inputShape).then(model => {
            //Clear all current outputs if there are
            d3.selectAll(".weightLine").remove();
            //Draw the color scales for the intermediate outputs
            drawColorScales(layersConfig);
            if (model !== null) {
                currentModel = model;
                //Reset train losses, test losses for the first creation.
                trainLosses = [];
                testLosses = [];
                trainModel(model, X_train, y_train, X_test, y_test, epochs, batchSize, learningRate, false);
            }
        });
    } else {
        trainModel(currentModel, X_train, y_train, X_test, y_test, epochs, batchSize, learningRate, false);
    }
}

function onWeightFilterInput() {
    dispatch.call("changeWeightFilter", null, undefined);
}

function onWeightFilterChanged(weightFilter) {
    //Reset weight display.
    for (let i = 0; i < layersConfig.length; i++) {
        let weightContainerId = getWeightsContainerId(i);
        if (layersConfig[i].layerType === "lstm") {
            drawLSTMWeights(weightContainerId);
            drawLstmTrainingWeights(weightContainerId);
        }
        if (layersConfig[i].layerType === "dense") {
            drawDenseWeights(weightContainerId);
            drawTrainingWeights(weightContainerId);
        }
    }

    for (let i = 0; i < layersConfig.length - 1; i++) {
        let layerInfo = layersConfig[i];
        //Network layer
        if (layerInfo.layerType !== 'flatten') {
            let weightContainerId = getWeightsContainerId(i);
            let outputWeightContainerId = getWeightsContainerId(i + 1);
            let weightsContainer = d3.select(`#${weightContainerId}`);
            let outputWeightsContainer = d3.select(`#${outputWeightContainerId}`);
            let weights = weightsContainer.selectAll(".weightLine");
            let outputWeights = outputWeightsContainer.selectAll(".weightLine");
            let layerId = layerInfo.id;//This is the same as 'layer' + layerInfo.timeStamp.
            let theLayer = d3.select(`#${layerId}`);

            let visibleIndexes = [];
            //If it is involved in any weight then it is visible.
            weights.each(w => {
                if (w.scaledWeight >= weightFilter) {
                    if (visibleIndexes.indexOf(w.targetIdx) < 0) {
                        visibleIndexes.push(w.targetIdx);
                    }
                }
            });
            outputWeights.each(w => {
                if (w.scaledWeight >= weightFilter) {
                    if (visibleIndexes.indexOf(w.sourceIdx) < 0) {
                        visibleIndexes.push(w.sourceIdx);
                    }
                }
            });
            //All the rest are belonging invisible.
            theLayer.selectAll(".layer" + layerInfo.timeStamp).style("opacity", (d, i) => {
                if (visibleIndexes.indexOf(i) >= 0) {
                    return 1.0;
                } else {
                    return 0;
                }
            });
        }
        //Input layer
        let theLayer = d3.select(`#inputContainer`);
        let outputWeightContainerId = getWeightsContainerId(0);
        let outputWeightsContainer = d3.select(`#${outputWeightContainerId}`);
        let outputWeights = outputWeightsContainer.selectAll(".weightLine");
        let visibleIndexes = [];
        outputWeights.each(w => {
            if (w.scaledWeight >= weightFilter) {
                if (visibleIndexes.indexOf(w.sourceIdx) < 0) {
                    visibleIndexes.push(w.sourceIdx);
                }
            }
        });
        //All the rest are belonging invisible.
        theLayer.selectAll(".inputDiv").style("opacity", (d, i) => {
            if (visibleIndexes.indexOf(i) >= 0) {
                return 1.0;
            } else {
                return 0;
            }
        });
    }
}

btnTrain = document.getElementById("trainingButtonContainer");

$('#trainingButtonContainer').click(function () {
    // $('#trainingButtonContainer').unbind('click');
    console.log("click");
    if ($(this).attr('class').includes("paused")) {
        btnTrain.innerHTML = '<i class="material-icons right" id="playPausedIcon">pause</i>Pause';
        console.log("Start");
        $(this).removeClass("paused");
        startTraining();
    } else {
        btnTrain.innerHTML = '<i class="material-icons right" id="playPausedIcon">play_arrow</i>Start';
        console.log("paused");
        $(this).addClass("paused");
        stopTraining();
    }
});





