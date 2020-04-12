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

    // processInputs().then(() => {
    //Create default layersConfig.
    // createDefaultLayers();
    // createTrainingGUI(layersConfig).then(() => {
    // loadAllPretrainModelFromServer("new_arrTemperature0_100_process");
    predictedVariable = "Unemployment rate";
    // loadModelFromKeras('unemployment_48months_ts12_L8L8D8D4_i200_2');
    // loadModelFromKeras('unemployment_48months_ts12_L8L8D8D4_i200');
    // loadModelFromKeras('unemployment_24months_ts12_L8L8D8D4_i450');
    // loadModelFromKeras('unemployment_ts12_L8L8D8D4_i900');
    loadModelFromKeras('unemployment_ts12_L8L8D8D4_i900_2');
    // loadModelFromKeras('HPCC_ts20_L8L8D8D4_i312');
    // loadModelFromKeras('RUL_ts50_L8L8D8D4_i100_f10');
    // loadModelFromKeras('RUL_ts50_L8L8D8D4_i100');
    // loadModelFromKeras('pollution_ts23_L6L6D4D4D2_i300');
    // });
    // });
}

updateInputs();

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

    resolve();
}

//TODO: Since we load the default models => this might not be needed => but there are few dataset specific information that we need to save/load before by passing this. So check again.
async function processInputs(sFs) {
    return new Promise(resolve => {
        d3.json("data/newData/X_train_pollution_ts23_i300.json").then(X_trainR => {
            d3.json("data/newData/y_train_pollution_ts23_i300.json").then(y_trainR => {
                d3.json("data/newData/X_test_pollution_ts23_i300.json").then(X_testR => {
                    d3.json("data/newData/y_test_pollution_ts23_i300.json").then(y_testR => {
                        // features = ['CPU1 Temp', 'CPU2 Temp', 'Inlet Temp', 'CPU Load', 'Memory usage', 'Fan1 speed', 'Fan2 speed', 'Fan3 speed', 'Fan4 speed', 'Power consumption'];
                        // features = ['Open', 'High', 'Low', 'Close', 'Volume'];
                        // features = ['Total_Nonfarm', 'Total_Private', 'Goods_Producing', 'Service_Providing', 'Manufacturing', 'Trade|Transportation|Utilities', 'Wholesale_Trade', 'Retail_Trade', 'Transportation|Warehousing|Utilities', 'Financial_Activities', 'Professional_and_Business_Services', 'Education|Health_Services', 'Leisure_and_Hospitality', 'Other_Services', 'Government'];
                        features = ['dew', 'temp', 'press', 'wnd_spd', 'snow'];
                        predictedVariable = "pollution";
                        dataItemName = "Data Instances";
                        if (!sFs) {
                            selectedFeatures = features.map(_ => true);
                        } else {
                            selectedFeatures = sFs;
                        }
                        // //TODO: These for testing the models.
                        // // selectedFeatures = [2, false, 4, 6, 7, false, 9, false, 12, 13, false, false, 17, false, false]; // for 8_8884
                        // // selectedFeatures = [false, 3, false, false, false, 8, false, 11, false, false, 14, 15, false, 20, 21];
                        // X_train = copyFeatures(X_trainR, selectedFeatures);
                        // X_test = copyFeatures(X_testR, selectedFeatures);
                        // processData(X_train, y_trainR, X_test, y_testR, resolve);
                        resolve();
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
        // d3.select('#inputColorScale').append('text').text("Click to toggle color scale");
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
            networkHeight = calculateNetworkHeight(122 + 50);
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
            // drawColorScales(layersConfig);
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

function findSortedTarget(targetIdx, sorted) {
    let sortedTargetIdx = null;
    sorted.find(function (d, i) {
        if (d.idx === targetIdx) {
            sortedTargetIdx = i;
            return true;
        }
    });
    return sortedTargetIdx;
}

$('#orderNeuronsSelect').on('change', function () {
    let selected;
    switch ($(this).val()) {
        case '1':
            selected = "unordered";
            break;
        case '2':
            selected = "weights";
            break;
        case '3':
            selected = "mse";
            break;
        case '4':
            selected = "correlation";
            break;
        default:
            selected = "correlation";
            break;
    }

    onReorderNeuronsCheckbox(selected);
});

function onReorderNeuronsCheckbox(measure) {

    let keys = Object.keys(neuronData[measure]);
    if (!originalWeights) {
        originalWeights = $.extend(true, {}, weightsPathData);
        originalTrainingWeights = $.extend(true, {}, trainingWeightsPathData);
    } else {
        weightsPathData = $.extend(true, {}, originalWeights);
        trainingWeightsPathData = $.extend(true, {}, originalTrainingWeights);
    }

    keys.forEach(function (key, keyIdx) {

        let htmlContainerId = key;
        let convertedKey;
        if (key === 'inputContainer') {
            convertedKey = 'layer0Weights';
        } else {
            convertedKey = key.replace('layer', 'weights');
        }

        let weightsPaths = weightsPathData[convertedKey];
        let weightsTraining = trainingWeightsPathData[convertedKey];
        let nextKeyIdx = (keyIdx + 1) < keys.length ? (keyIdx + 1) : 0;

        let sorted = neuronData[measure][key].sortedData;
        let nextSorted = neuronData[measure][keys[nextKeyIdx]].sortedData;

        let htmlContainer = $(`#${htmlContainerId}`);

        if (!originalNeurons[key]) {
            originalNeurons[key] = htmlContainer.children();
        }
        htmlContainer.empty();
        sorted.forEach(function (d, i) {

            htmlContainer.append(originalNeurons[key][d.idx]);
            let sourceIdx = d.idx;
            weightsPaths.lineData.filter(line => line.sourceIdx === sourceIdx).forEach(function (v) {
                v.source.y = v.source.y - (d.idx - i) * 122;
                // v.newSourceIdx = i;
                if (keyIdx + 1 < keys.length) {
                    let sortedTargetIdx = findSortedTarget(v.targetIdx, nextSorted);
                    v.target.y = v.target.y + (sortedTargetIdx - v.targetIdx) * 122;
                    // v.newTargetIdx = sortedTargetIdx;
                }
            });
            weightsTraining.lineData.filter(line => line.sourceIdx === sourceIdx).forEach(function (v) {
                v.paths.forEach(function (path) {
                    // path.newSourceIdx = sourceIdx;
                    path.source.y = path.source.y - (d.idx - i) * 122;
                    path.target.y = path.target.y - (d.idx - i) * 122;
                })
            });
        });

        if (weightsPaths.layerType === 'lstm') {
            drawLSTMWeights(convertedKey);
            drawLstmTrainingWeights(convertedKey);
        } else {
            drawDenseWeights(convertedKey);
            drawTrainingWeights(convertedKey);
        }
    });
}

function onHeatmapShowingCheckbox() {
    let checked = $('#heatmapShowingCheckbox').prop('checked');
    if (checked) {
        for (let neuron in mapObjects) {
            if (mapObjects[neuron].type === 'lstmheatmap') {
                let config = mapObjects[neuron];
                let htmlContainer = config.canvas.node().parentNode.parentNode;
                config.settings.xScale = null;
                d3.select(htmlContainer).select('.linechart').remove();
                config.settings.yScale = null;
                let newNeuron = new HeatMap(htmlContainer, config.data, config.settings);
                newNeuron.plot();
                mapObjects[neuron] = newNeuron;

                rearrangeCharts(htmlContainer, [0, 2, 1]);

            }
        }
        neuronShowingHeatmap = true;
    } else {
        for (let neuron in mapObjects) {
            if (mapObjects[neuron].type === 'heatmap') {
                let config = mapObjects[neuron];
                let htmlContainer = config.canvas.node().parentNode.parentNode;
                d3.select(htmlContainer).select('.heatmap').remove();
                config.settings.xScale = null;
                config.settings.yScale = null;
                let newNeuron = new LstmLineChart(htmlContainer, config.data, config.settings);
                newNeuron.plot();
                mapObjects[neuron] = newNeuron;

                rearrangeCharts(htmlContainer, [0, 2, 1]);
            }
        }
        neuronShowingHeatmap = false;
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
            // drawLSTMWeights(weightContainerId);
            drawLstmTrainingWeights(weightContainerId);
        }
        if (layersConfig[i].layerType === "dense") {
            // drawDenseWeights(weightContainerId);
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
            theLayer.selectAll(".layer" + layerInfo.timeStamp).style("visibility", (d, i) => {
                if (visibleIndexes.indexOf(i) >= 0) {
                    return "visible";
                } else {
                    return "hidden";
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
        theLayer.selectAll(".inputDiv").style("visibility", (d, i) => {
            if (visibleIndexes.indexOf(i) >= 0) {
                return "visible";
            } else {
                return "hidden";
            }
        });
    }
}

btnTrain = document.getElementById("trainingButtonContainer");

$('#trainingButtonContainer').click(function () {
    // $('#trainingButtonContainer').unbind('click');
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

function updateDataForLstmLinechart(isOutlier, key) {
    let data = cachedMapObjects[key].data;
    let newData = {};
    let newY = [];

    isOutlier.forEach(function (d, idx) {
        if (d) {
            newY.push(data.y[idx]);
        }
    });

    newData.x = cachedMapObjects[key].data.x;
    newData.y = newY;
    newData.z = cachedMapObjects[key].data.z;
    newData.shap = cachedMapObjects[key].data.shap;
    newData.isOutlier = isOutlier;

    mapObjects[key].update(newData);
}

function updateStateDataForLstmLinechart(isStateObservation, key) {
    let newData = {};

    newData.x = cachedMapObjects[key].data.x;
    newData.y = cachedMapObjects[key].data.y;
    newData.z = cachedMapObjects[key].data.z;
    newData.shap = cachedMapObjects[key].data.shap;
    newData.isOutlier = cachedMapObjects[key].data.isOutlier;
    newData.isStateObservation = isStateObservation;

    mapObjects[key].update(newData);
}

function updateDataForDenseLinechart(isOutlier, key) {
    let predicted = cachedMapObjects[key].data[0];

    let newData = [];

    let newPredicted = {};
    newPredicted.isOutlier = isOutlier;
    newPredicted.marker = predicted.marker;
    newPredicted.series = predicted.series;
    newPredicted.shap = predicted.shap;
    newPredicted.type = predicted.type;
    newPredicted.x = predicted.x;
    newPredicted.y = predicted.y;

    newData.push(newPredicted);
    newData.push(cachedMapObjects[key].data[1]);

    mapObjects[key].update(newData);
}

function updateStateDataForDenseLinechart(isStateObservation, key) {
    let predicted = cachedMapObjects[key].data[0];

    let newData = [];

    let newPredicted = {};
    newPredicted.isOutlier = predicted.isOutlier;
    newPredicted.marker = predicted.marker;
    newPredicted.series = predicted.series;
    newPredicted.shap = predicted.shap;
    newPredicted.type = predicted.type;
    newPredicted.x = predicted.x;
    newPredicted.y = predicted.y;
    newPredicted.isStateObservation = isStateObservation;

    newData.push(newPredicted);
    newData.push(cachedMapObjects[key].data[1]);

    mapObjects[key].update(newData);
}

function calculateValidInstances(filterValue) {
    let output = cachedMapObjects['output0'];
    let outputData = output.data;
    let actual = outputData.filter(d => d.series === 'actual')[0].x;
    let predicted = outputData.filter(d => d.series === 'predicted')[0].x;

    let absError = [];
    actual.forEach(function (actElement, idx) {
        let ae = Math.abs(actElement - predicted[idx]);
        absError.push(ae);
    });

    let maxAE = d3.max(absError);

    let isOutlier = [];
    absError.forEach(function (d) {
        isOutlier.push(d >= (filterValue / 100) * maxAE);
    });

    isOutlierGlobal = isOutlier;

    for (let key in cachedMapObjects) {
        console.log(key);
        console.log(key.includes('layer'));
        // if (!key.includes('layer') || !key.includes('input')) {
        //     continue;
        // }
        if (cachedMapObjects[key].type !== 'linechart') {
            updateDataForLstmLinechart(isOutlier, key);
        } else {
            updateDataForDenseLinechart(isOutlier, key);
        }
    }
}

let firstTime = true;

$('#mae-range').on('input', function () {
    // console.log($(this).val());
    // for (let key in mapObjects) {
    //     console.log(key, mapObjects[key]);
    //
    // }

    if (firstTime) {
        cachedMapObjects = JSON.parse(JSON.stringify(mapObjects));
        firstTime = false;
    }

    calculateValidInstances($(this).val());
});

function changeShapValues(state) {
    if (firstTime) {
        cachedMapObjects = JSON.parse(JSON.stringify(mapObjects));
        firstTime = false;
    }

    let stateIdList = [];
    if (state !== 'all') {
        stateIdList = [];
        trainIdState.forEach((s, idx) => {
            if (s === state) {
                stateIdList.push(idx);
            }
        });
    } else {
        stateIdList = Array.from(Array(450).keys());
    }
    let isStateObservation = isStateObservationGlobal;



    //Hard code here
    let idx = 0;

    for (let layer in shapValuesMap) {
        let newShapValues = [];
        let layerShapValues = shapValuesMap[layer];
        layerShapValues.forEach(function (d, idx) {
            if (stateIdList.includes(idx)) {
                newShapValues.push(d);
                isStateObservation[idx] = true;
            }
        });
        let selector = "";
        if (layer.includes('input')) {
            selector = 'inputDiv';
        } else {
            selector = `layer${idx}`;
            idx++;
            if (layersConfig[idx]) {
                if (layersConfig[idx].id.includes('flatten')) {
                    idx++;
                }
            }
        }
        updateAreaChart(newShapValues, layer.includes('input'), selector);
    }

    console.log(isStateObservation.filter(d => d));

    for (let key in cachedMapObjects) {
        if (cachedMapObjects[key].type !== 'linechart') {
            updateStateDataForLstmLinechart(isStateObservation, key);
        } else {
            updateStateDataForDenseLinechart(isStateObservation, key);
        }
    }
}

function updateAreaChart(shapValues, isInputLayer, selector) {
    let noOfItems = shapValues.length;
    let noOfSteps = shapValues[0].length;
    let noOfFeatures = shapValues[0][0].length;

    //Generate steps
    let x = Array.from(Array(noOfSteps), (x, i) => i);
    //Generate items
    let y = Array.from(Array(noOfItems), (x, i) => i).reverse();//reverse since we sort from lower engine number to higher engine number

    // let flattenedZ = shapValues ? shapValues.flat().flat() : [1];
    // let minShapValue = d3.min(flattenedZ);
    // let maxShapValue = d3.max(flattenedZ);

    // let maxBound = d3.max([Math.abs(minShapValue), Math.abs(maxShapValue)]);

    // minShapValue = -maxBound;
    // maxShapValue = maxBound;

    let minPosAreaShapValue = 0, maxPosAreaShapValue = 0;
    let minNegAreaShapValue = 0, maxNegAreaShapValue = 0;

    let areaChartList = [];

    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        // let z = [];
        let shap = [];
        let sumPositiveShap = [];
        let sumNegativeShap = [];
        for (let itemIdx = noOfItems - 1; itemIdx >= 0; itemIdx--) {//Reverse order of items from big (top) to small (bottom).
            // let rowZ = [];
            let rowShap = [];
            for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
                // rowZ.push(data[itemIdx][stepIdx][featureIdx]);
                rowShap.push(shapValues ? shapValues[itemIdx][stepIdx][featureIdx] : 0);
            }
            // z.push(rowZ);
            shap.push(rowShap);
        }

        for (let i = 0; i < shap[0].length; i++) {
            let positive = 0;
            let negative = 0;
            let sum = 0;
            shap.forEach(instance => {
                if (instance[i] > 0) {
                    positive += instance[i];
                } else {
                    negative += Math.abs(instance[i]);
                }
                sum += instance[i];
            });
            sumPositiveShap.push(positive);
            sumNegativeShap.push(negative);
        }

        // if (!mapObjects[selector + featureIdx]) {
        //Draw the feature.
        // let hmSettings = {
        //     noSvg: true,
        //     showAxes: false,
        //     paddingLeft: 0,
        //     paddingRight: 0,
        //     paddingTop: 0,
        //     paddingBottom: 0,
        //     borderWidth: 0,
        //     width: 100,
        //     height: heatmapH,
        //     minInputValue: isInputLayer ? minDataVal : -1,
        //     maxInputValue: isInputLayer ? maxDataVal : 1,
        //     minShapValue: minShapValue,
        //     maxShapValue: maxShapValue,
        //     isInputLayer: isInputLayer,
        //     haveBorder: true,
        //     reverseY: true
        // };

        let areaSettings = {
            noSvg: false,
            showAxes: false,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderWidth: 0,
            width: 100,
            height: 25,
            isInputLayer: isInputLayer,
        };

        let maxPos = d3.max(sumPositiveShap);
        let minPos = d3.min(sumPositiveShap);
        let maxNeg = d3.max(sumNegativeShap);
        let minNeg = d3.min(sumNegativeShap);

        if (minPosAreaShapValue > minPos) {
            minPosAreaShapValue = minPos
        }
        if (maxPosAreaShapValue < maxPos) {
            maxPosAreaShapValue = maxPos
        }
        if (minNegAreaShapValue > minNeg) {
            minNegAreaShapValue = minNeg
        }
        if (maxNegAreaShapValue < maxNeg) {
            maxNegAreaShapValue = maxNeg
        }

        // let hm = null;

        // if (neuronShowingHeatmap) {
        //     hm = new HeatMap(document.getElementById(selector + featureIdx), {
        //         x: x,
        //         y: y,
        //         z: z,
        //         shap: shap,
        //         isOutlier: isOutlierGlobal
        //     }, hmSettings);
        // } else {
        //     hm = new LstmLineChart(document.getElementById(selector + featureIdx), {
        //         x: x,
        //         y: y,
        //         z: z,
        //         shap: shap,
        //         isOutlier: isOutlierGlobal
        //     }, hmSettings);
        // }

        areaChartList.push({
            'selector': selector + featureIdx,
            'container': document.getElementById(selector + featureIdx),
            'dataPositive': {x: x, y: sumPositiveShap},
            'dataNegative': {x: x, y: sumNegativeShap},
            'settings': areaSettings
        });

        // hm.plot();
        // mapObjects[selector + featureIdx] = hm;
        // } else {
        //     let hm = mapObjects[selector + featureIdx];
        //     hm.update({x: x, y: y, z: z, shap: shap});
        // }
    }
    areaChartList.forEach(function (item) {
        let topArea = mapAreaObjects[item.selector].positive;

        let positiveAreaSetting = item.settings;
        positiveAreaSetting.minShapValue = minPosAreaShapValue;
        positiveAreaSetting.maxShapValue = maxPosAreaShapValue;
        positiveAreaSetting.direction = 'up';
        topArea.update(item.dataPositive, positiveAreaSetting);

        let botArea = mapAreaObjects[item.selector].negative;
        let negativeAreaSetting = item.settings;
        negativeAreaSetting.minShapValue = minNegAreaShapValue;
        negativeAreaSetting.maxShapValue = maxNegAreaShapValue;
        positiveAreaSetting.direction = 'down';
        botArea.update(item.dataNegative, negativeAreaSetting);
    });
}




