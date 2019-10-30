let weightsPathData = {};
let weightValueColorScheme = ["red", "blue"];

function processLayers(layers) {
    //Process layer.
    //Add one layer for the output, if it doesn't contain one yet.
    if (layers.find(l => l.id === "output") === undefined) {
        layers.push({
            id: "output",
            timeStamp: "output",
            layerType: "dense",
            units: 1,
            activation: "relu"
        });
    }
    //Add flatten layer if needed
    layers.forEach((l, i) => {
        //If this layer is lstm and the next one is dense => we need a flatten layer.
        if (l.layerType === "lstm" && layers[i + 1].layerType === "dense") {
            layers.splice(i + 1, 0, {
                id: 'layerFlatten' + i,
                timeStamp: 'Flatten' + i,
                layerType: "flatten",
            });
        }
    });
}

async function createModel(layers, inputShape) {
    await processLayers(layers);

    //Now create model
    return new Promise((resolve, reject) => {
        try {
            let mLayers = [];
            //Input layer
            console.log(layers);

            layers.forEach((l, i) => {
                let layerOption = {
                    units: l.units
                };
                //If it is the first one we input inputShape.
                if (i === 0) {
                    layerOption.inputShape = inputShape;
                }
                //If it is LSTM we add return sequence.
                if (l.layerType === "lstm") {
                    layerOption.returnSequences = true;
                }
                //If it has activation we add it
                if (l.activation !== "default") {
                    layerOption.activation = l.activation;
                }
                mLayers.push(tf.layers[l.layerType](layerOption));
            });
            const model = tf.sequential({
                layers: mLayers
            });

            model.compile({
                optimizer: 'adam',
                loss: 'meanSquaredError',
            });
            resolve(model);
        } catch (e) {
            alert("Error: " + e.message);
            resolve(null);
        }

    });
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

async function trainModel(model, X_train, y_train, X_test, y_test, epochs = 50, batchSize = 8, reviewMode) {

    let X_train_T = tf.tensor(X_train);
    let y_train_T = tf.tensor(y_train);
    let X_test_T = tf.tensor(X_test);
    let y_test_T = tf.tensor(y_test);
    let trainSampleIndices = shuffle(Array.from(new Array(y_train.length), (d, i) => i)).slice(24);
    let testSampleIndices = shuffle(Array.from(new Array(y_test.length), (d, i) => i)).slice(24);
    let sample_X_train_T = tf.tensor(trainSampleIndices.map(i => X_train[i]));
    let sample_y_train_T = tf.tensor(trainSampleIndices.map(i => y_train[i]));

    let sample_X_test_T = tf.tensor(testSampleIndices.map(i => X_test[i]));
    let sample_y_test_T = tf.tensor(testSampleIndices.map(i => y_test[i]));

    let y_train_ordered = trainRULOrder.map(d => y_train[d]);
    let X_train_ordered = trainRULOrder.map(d => X_train[d]);
    let X_test_ordered = testRULOrder.map(d => X_test[d]);
    let y_test_ordered = testRULOrder.map(d => y_test[d]);

    let X_train_T_ordered = tf.tensor(X_train_ordered);
    let X_test_T_ordered = tf.tensor(X_test_ordered);
    let y_test_T_ordered = tf.tensor(y_test_ordered);

    let y_train_flat_ordered = y_train_ordered.flat();
    let y_test_flat_ordered = y_test_ordered.flat();
    let target_ordered = normalizeTarget(y_train_flat_ordered, -1.0, 1.0);

    let lineChartSettings = {
        noSvg: true,
        showAxes: false,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        width: 100,
        height: 100,
        colorScheme: outputColorScheme
    };
    const testWidth = 250;
    const testHeight = 230;
    let outputSettings = {
        noSvg: false,
        showAxes: true,
        paddingLeft: 40,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        width: testWidth,
        height: testHeight,
        title: {
            text: "Training"
        },
        legend: {
            x: 50,
            y: 35
        },
        colorScheme: outputColorScheme
    };

    let batches = Math.ceil(y_train_flat_ordered.length / batchSize) * epochs;
    let trainBatches = Array.from(Array(batches), (x, i) => i);
    //TODO: Use these if we display train/test loss every epoch
    // let batches = Math.ceil(y_train_flat_ordered.length / batchSize) * epochs;
    // let trainBatches = Array.from(Array(batches), (x, i) => i);
    let testOutputSettings = {
        noSvg: false,
        showAxes: true,
        paddingLeft: 40,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        width: testWidth,
        height: testHeight,
        title: {
            text: "Testing"
        },
        legend: {
            x: 50,
            y: 35
        },
        colorScheme: testOutputColorScheme
    };
    let trainLossW = 800;
    let trainLossH = 200;
    let trainLossBatchSettings = {
        noSvg: false,
        showAxes: true,
        paddingLeft: 60,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 40,
        width: trainLossW,
        height: trainLossH,
        colorScheme: trainTestLossColorScheme,
        legend: {
            x: trainLossW - 50,
            y: 35
        },
        title: {
            text: 'Training loss vs. testing loss.'
        },

        xAxisLabel: {
            text: 'Batch'
        },
        yAxisLabel: {
            text: 'Loss'
        }
    };
    let xScaleTest = d3.scaleLinear().domain([0, batches]).range([0, trainLossBatchSettings.width - trainLossBatchSettings.paddingLeft - trainLossBatchSettings.paddingRight]);
    trainLossBatchSettings.xScale = xScaleTest;


    //Draw the legends for weights
    //Draw weights type on the last layer (to avoid conflict with other types), and also this one sure always there is one.
    drawWeightTypes(d3.select("#" + getWeightsContainerId(layersConfig.length - 1)));

    //Draw the lstm to the first layer.
    for (let i = 0; i < layersConfig.length; i++) {
        let l = layersConfig[i];
        if (layersConfig[i].layerType === "lstm") {
            let containerId = getWeightsContainerId(i);
            let theContainer = d3.select("#" + containerId);
            drawLSTMWeightTypes(theContainer);
            break;//Draw only one => so break after this.
        }
    }
    //Draw the flatten notification for every flatten layer (to the layer before that, in term of display grid element.).
    for (let i = 0; i < layersConfig.length; i++) {
        if (layersConfig[i].layerType === "flatten") {
            let containerId = getWeightsContainerId(i);
            let theContainer = d3.select("#" + containerId);
            drawFlattenNotification(theContainer);
        }
    }

    //Also toggle the weight displaying menu according to the default display.
    toggleWeightsMenu();

    // let callbacks = [onEpochEnd: onEpochEnd, onBatchEnd: onBatchEnd, onTrainEnd: onTrainEnd]

    if (!reviewMode) {
        model.fit(X_train_T, y_train_T, {
            batchSize: batchSize,
            epochs: epochs,
            // learningRate: 0.005,
            // shuffle: true,
            callbacks: {onEpochEnd: onEpochEnd, onBatchEnd: onBatchEnd, onTrainEnd: onTrainEnd},
        });
    } else {
        plotTrainLossData(trainLosses, testLosses);
        displayEpochData(model, trainLosses[testLosses.length - 1], testLosses[testLosses.length - 1]);
    }

    //<editor-fold desc="For LSTM weight types" and its toggling menu">
    async function drawLSTMWeightTypes(container) {
        return new Promise((resolve, reject) => {
            let lstmTypes = container.selectAll(".lstmTypeContainer").data([1]).join("g").attr("class", "lstmTypeContainer")
                .attr("transform", "translate(3, 0)")//3 is for the margin.
                .selectAll(".lstmWeightType")
                .data(lstmWeightTypes);
            //Create the rect for clicking
            // lstmTypes.join("rect")
            //     .attr("x", 5).attr("y", (d, i) => (i - 1) * 10)
            //     .attr("fill", "white")
            //     .attr("width", 60).attr("height", 9)
            //     .style("cursor", "pointer")
            //     .on("click", function (d, i) {
            //         onLSTMWeightTypeClick(i);
            //     });
            lstmTypes.join("text").text(d => d)
                .attr("class", "lstmWeightType")
                .attr("font-size", 10)
                .attr("x", 0).attr("y", 0).attr("dy", (d, i) => `${i}em`)
                .style("cursor", "pointer")
                .on("click", function (d, i) {
                    onLSTMWeightTypeClick(i);
                })
                .on("mouseover", function () {
                    d3.select(this).attr("stroke", "red");
                })
                .on("mouseleave", function () {
                    d3.select(this).attr("stroke", "none");
                });
            //Draw weight guide.
            container.selectAll(".guidePath").data(["M60,5 C85,5 85,5 100,43", "M60,15 C85,15 85,15 100,53", "M60,25 C85,25 85,25 100,63", "M60,35 C85,35 85,35 100,73"]).join("path")
                .attr("d", d => d)
                .attr("marker-end", "url(#arrow)")
                .attr("fill", "none")
                .attr("stroke", "black");
            resolve(true);
        });
    }

    function onLSTMWeightTypeClick(typeIdx) {
        if (typeIdx === 0) {//toggle all
            for (let i = 0; i < lstmWeightTypeDisplay.length; i++) {
                lstmWeightTypeDisplay[i] = 1 - 1 * lstmWeightTypeDisplay[i];//toggle all in this case.
            }
        } else {
            lstmWeightTypeDisplay[typeIdx - 1] = 1 - 1 * lstmWeightTypeDisplay[typeIdx - 1];//toggle. -1 because the first one is for toggle all command
        }
        //Redraw all the lstm weights.
        layersConfig.forEach((l, i) => {
            if (l.layerType === "lstm") {
                drawLSTMWeights(getWeightsContainerId(i));
            }
        });
        //Todo: Fix this.
        toggleWeightsMenu();
        dispatch.call("changeWeightFilter");
    }

    //</editor-fold>

    //<editor-fold desc="For positive/negative weight types">
    async function drawWeightTypes(container) {
        return new Promise((resolve, reject) => {
            container.selectAll(".weightTypeGroup").data([1]).join("g").attr("class", "weightTypeGroup").selectAll(".weightColor").data(["(click to toggle)", "-- negative", "-- positive"]).join("text").text(d => d)
                .attr("font-size", 10)
                .attr("class", "weightColor")
                .attr("x", 5).attr("y", 0).attr("dy", (d, i) => `${i + 1}em`)
                .attr("fill", (d, i) => i == 0 ? "black" : weightValueColorScheme[i - 1])
                .on("click", function (d, i) {
                    onWeightTypeClick(i);
                })
                .on("mouseover", function () {
                    d3.select(this).attr("stroke", "red");
                })
                .on("mouseleave", function () {
                    d3.select(this).attr("stroke", "none");
                });
            resolve(true);
        });
    }

    function onWeightTypeClick(typeIdx) {
        if (typeIdx == 0) {//toggle all
            for (let i = 0; i < weightTypeDisplay.length; i++) {
                weightTypeDisplay[i] = 1 - 1 * weightTypeDisplay[i];//toggle all in this case.
            }
        } else {
            weightTypeDisplay[typeIdx - 1] = 1 - 1 * weightTypeDisplay[typeIdx - 1];//toggle. -1 because the first one is for toggle all command
        }
        //Redraw all weights without having to rebuild them (since there is no update).
        for (let i = 0; i < layersConfig.length; i++) {
            let containerId = getWeightsContainerId(i);

            if (layersConfig[i].layerType === "lstm") {
                drawLSTMWeights(containerId);
            }
            if (layersConfig[i].layerType === "dense") {
                drawDenseWeights(containerId);
            }
        }
        toggleWeightsMenu();
        dispatch.call("changeWeightFilter", null, undefined);
    }

    //</editor-fold>

    //<editor-fold desc="For flatten layer notification">
    async function drawFlattenNotification(container) {
        return new Promise((resolve, reject) => {
            container.selectAll(".flattenLegend").data(["Flatten layer", "(cumulative weights)"]).join("text").text(d => d)
                .attr("class", "flattenLegend")
                .attr("font-size", 10)
                .attr("x", 3).attr("y", 0).attr("dy", (d, i) => `${i + 1}em`);
            //Draw the guide.
            container.selectAll(".guidePath").data(["M50,25 C50,40 25,57 3,57"]).join("path")
                .attr("d", d => d)
                .attr("marker-end", "url(#arrow)")
                .attr("fill", "none")
                .attr("stroke", "black");
            resolve(true);
        });
    }

    //</editor-fold>

    function onTrainEnd(batch, logs) {
        //Display training time
        console.log('Training time' + (new Date() - trainStartTime));
        isTraining = false;
        d3.selectAll(".weightLineTraining").classed("weightLineTraining", isTraining);//Done training, stop animating
        //Toggle button.
        btnTrain.classList.remove("paused");
        //Enable the save/load buttons
        d3.select("#saveModelMenu").attr("disabled", null);
        d3.select("#loadModelMenu").attr("disabled", null);
    }

    async function displayLayersOutputs(model, i, input) {
        if (i >= model.layers.length - 1) {
            return;//Do not draw the final output
        }
        let layer = model.layers[i];
        let ts = layer.apply(input);
        let timeStamp = layersConfig[i].timeStamp;
        if (layer.name.indexOf("lstm") >= 0) {
            ts.array().then(data => {
                data.layerName = "LSTM " + i;
                drawHeatmaps(data, "layerContainer" + timeStamp, "layer" + timeStamp);
            });
        } else if (layer.name.indexOf("flatten") >= 0) {
            //For flatten we don't have to do anything.
        } else if (layer.name.indexOf("dense") >= 0) {
            ts.array().then(data => {
                data.layerName = "Dense " + i;
                drawLineCharts(data, normalizeTarget, target_ordered, "layerContainer" + timeStamp, "layer" + timeStamp, lineChartSettings, false);
            });
        }
        //Recurse
        if (i < model.layers.length - 1) {//We will draw the output separately.
            displayLayersOutputs(model, i + 1, ts);
        }
    }

    function plotTrainLossDetails() {
        let theMapContainer = document.getElementById("mapDetailsContent");
        d3.select(theMapContainer).selectAll("*").remove();

        let trainLossBatchSettings = {
            noSvg: false,
            showAxes: true,
            paddingLeft: 60,
            paddingRight: 10,
            paddingTop: 20,
            paddingBottom: 40,
            width: 350,
            height: 350,
            legend: {
                x: 350 - 50,
                y: 35
            },
            title: {
                text: 'Training loss vs. testing loss.'
            },
            xAxisLabel: {
                text: 'Batch'
            },
            yAxisLabel: {
                text: 'Loss'
            },
            colorScheme: trainTestLossColorScheme

        };

        let lc = new LineChart(theMapContainer, mapObjects['trainTestLoss'].data, trainLossBatchSettings);
        lc.plot();

        let mapDetails = M.Modal.getInstance(document.getElementById("mapDetails"));
        mapDetails.open();
    }

    async function plotTrainLossData(trainLosses, testLosses) {
        if (!trainLossBatchSettings.yScale) {
            trainLossBatchSettings.yScale = d3.scaleLinear().domain([0, trainLosses[0] > testLosses[0] ? trainLosses[0] : testLosses[0]]).range([trainLossBatchSettings.height - trainLossBatchSettings.paddingTop - trainLossBatchSettings.paddingBottom, 0]);
        }
        const lineChartData = [
            {
                x: trainBatches,
                y: trainLosses,
                series: 'train',
            },
            {
                x: trainBatches,
                y: testLosses,
                series: 'test',
            }
        ];
        if (!mapObjects['trainTestLoss']) {
            //Draw the feature.
            d3.select("#trainTestLoss").on("click", () => {
                plotTrainLossDetails();
            });
            let lc = new LineChart(document.getElementById('trainTestLoss'), lineChartData, trainLossBatchSettings);
            lc.plot();
            mapObjects['trainTestLoss'] = lc;
        } else {
            let lc = mapObjects['trainTestLoss'];
            lc.update(lineChartData);
        }
    }

    function onBatchEnd(batch, logs) {
        // let trainLoss = logs.loss;
        model.evaluate(sample_X_train_T, sample_y_train_T).data().then(trainRet => {
                let trainLoss = trainRet[0];
                model.evaluate(sample_X_test_T, sample_y_test_T).data().then(testRet => {
                    let testLoss = testRet[0];
                    trainLosses.push(trainLoss);
                    testLosses.push(testLoss);
                    plotTrainLossData(trainLosses, testLosses);
                });
            }
        );

        //TODO: This is slow, due to asynchronous behavior so putting it in epoch ends may have visual display bug, therefore we put it here, but it lowers the perf.
        if (Math.ceil(X_train.length / batchSize) > 1) {
            dispatch.call("changeWeightFilter");
        }
    }

    function updateLinks(model) {

    }

    function displayEpochData(model, trainLoss, testLoss) {
        for (let i = 0; i < layersConfig.length; i++) {
            let containerId = getWeightsContainerId(i);
            displayLayerWeights(model, i, containerId);
        }

        //it will display recursively.
        displayLayersOutputs(model, 0, X_train_T_ordered);

        //Draw output
        let ts = model.predict(X_train_T_ordered);
        ts.array().then(data => {
            //We don't normalize the final result.
            data.layerName = "Training output";
            drawLineCharts(data, null, y_train_flat_ordered, "outputContainer", "output", outputSettings, true).then(() => {
                //Update the training loss
                updateGraphTitle("outputContainer", "Training, MSE: " + trainLoss.toFixed(2));
            });
            updateVarNetwork();
        });
        //Draw the testing data.
        let test = model.predict(X_test_T_ordered);
        test.array().then(data => {
            //We don't normalize the final result.
            data.layerName = "Testing output";
            drawLineCharts(data, null, y_test_flat_ordered, "testContainer", "test", testOutputSettings, true).then(() => {
                //Update test loss
                testLoss = reviewMode ? testLoss : model.evaluate(X_test_T_ordered, y_test_T_ordered).dataSync()[0];
                updateGraphTitle("testContainer", "Testing, MSE: " + testLoss.toFixed(2));
            });
        });
    }

    function onEpochEnd(epoch, logs) {
        hideLoader();
        if (epoch === 0) {
            createVarNetwork();
        } else {
            updateVarNetwork();
        }
        displayEpochData(model, logs.loss);
        if (epoch > 1) {
            //We don't update for the first epoch
            dispatch.call("changeWeightFilter");
        }
    }
}

async function displayLayerWeights(model, i, containerId) {
    let layer = model.layers[i];
    let weights = layer.getWeights()[0];

    if (layer.name.indexOf("lstm") >= 0) {
        buildWeightPositionData(weights, heatmapH, 17.5, 100, 17.5, 100, 4, 10, 0, 3, minLineWeightOpacity, maxLineWeightOpacity).then((result) => {
            weightsPathData[containerId] = result;//Store to use on click
            drawLSTMWeights(containerId);
        });
    } else if (layer.name.indexOf("dense") >= 0 && i - 1 >= 0 && model.layers[i - 1].name.indexOf("flatten") >= 0) {//Is dense, but its previous one is flatten
        let flattenSplits = model.layers[i - 2].units;//Number of splits (divide weights in these number of splits then combine them in each split)
        buildWeightForFlattenLayer(weights, flattenSplits).then(cumulativeT => {
            buildWeightPositionData(cumulativeT, heatmapH, 17.5, 100, 17.5, 100, 1, 0, 0.5, 3, minLineWeightOpacity, maxLineWeightOpacity).then((result) => {
                weightsPathData[containerId] = result;
                drawDenseWeights(containerId);
            });
        });
    } else if (model.layers[i].name.indexOf("dense") >= 0) {//Remember this must be else if to avoid conflict with prev case.
        buildWeightPositionData(weights, 100, 17.5, 100, 17.5, 100, 1, 0, 0.5, 3, minLineWeightOpacity, maxLineWeightOpacity).then((result) => {
            weightsPathData[containerId] = result;
            drawDenseWeights(containerId);
        });
    }


    //Don't have to draw weights of flatten, will only use it next layer (model.layersConfig[i].name.indexOf("flatten"))

}

function toggleWeightsMenu() {
    //Toggle menu opacity.
    d3.selectAll(".lstmWeightType").attr("opacity", (d, i) => i === 0 ? 1 : 0.5 + 0.5 * lstmWeightTypeDisplay[i - 1]);//The first one is for click to toggle and will be visible by default
    d3.selectAll(".weightColor").attr("opacity", (d, i) => i === 0 ? 1 : 0.5 + 0.5 * weightTypeDisplay[i - 1]);//The first one is for click to toggle and will be visible by default
}

function drawDenseWeights(containerId) {
    let result = weightsPathData[containerId];
    if (result) {
        d3.select("#" + containerId).selectAll(".weightLine")
            .data(result.lineData.filter(d => weightTypeDisplay[d.weight > 0 ? 1 : 0] === 1), d => d.idx, d => d.idx).join('path')
            .attr("class", "weightLine")
            .classed("weightLineTraining", isTraining)
            .attr("d", d => link(d))
            .attr("fill", "none")
            .attr("stroke", d => weightValueColorScheme[d.weight > 0 ? 1 : 0])
            .attr("stroke-width", d => result.strokeWidthScale(d.weight > 0 ? d.weight : -d.weight))
            .attr("opacity",
                d => {
                    if (d.scaledWeight >= $("#weightFilter").val()) {
                        return result.opacityScaler(d.weight > 0 ? d.weight : -d.weight);
                    } else {
                        return 0;
                    }
                })
            .on("mouseover", (d) => {
                showTip(`Current weight: ${d.weight.toFixed(2)}`);
            })
            .on("mouseout", () => {
                hideTip();
            });
    }
}

function drawLSTMWeights(containerId) {
    let result = weightsPathData[containerId];
    if (result) {
        d3.select("#" + containerId).selectAll(".weightLine")
            .data(result.lineData.filter(d => lstmWeightTypeDisplay[d.type] === 1 && weightTypeDisplay[d.weight > 0 ? 1 : 0] === 1), d => d.idx).join('path')
            .attr("class", "weightLine")
            .classed("weightLineTraining", isTraining)
            .attr("d", d => link(d))
            .attr("fill", "none")
            .attr("stroke", d => weightValueColorScheme[d.weight > 0 ? 1 : 0])
            .attr("stroke-width", d => result.strokeWidthScale(d.weight > 0 ? d.weight : -d.weight))
            .attr("opacity", d => {
                if (d.scaledWeight >= $("#weightFilter").val()) {
                    return result.opacityScaler(d.weight > 0 ? d.weight : -d.weight);
                } else {
                    return 0;
                }
            })
            .on("mouseover", (d) => {
                showTip(`Current weight: ${d.weight.toFixed(2)}`);
            })
            .on("mouseout", () => {
                hideTip();
            });
    }
}

//The container id is a bit involving because of the weights is displayed in prev layer, and also we prev 2 layer if the prev layer is flatten layer.
function getWeightsContainerId(i) {
    let containerId = "layer0Weights";
    if (i !== 0 && layersConfig[i - 1].layerType.indexOf("flatten") >= 0) {
        containerId = "weightsContainer" + layersConfig[i - 2].timeStamp;//Prev 2 layers if it is lstm
    } else if (i !== 0) {
        containerId = "weightsContainer" + layersConfig[i - 1].timeStamp;//Otherwise prev layer.
    }
    return containerId;
}