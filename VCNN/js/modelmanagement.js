let weightsPathData = {};
let trainingWeightsPathData = {};
let weightValueColorScheme = ["red", "blue"];
let weightRainbowScale = d3.scaleSequential()
    .interpolator(d3.interpolateViridis)
    .domain([0, 2 * Math.PI]);
let currentEpoch = null;

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

async function trainModel(model, X_train, y_train, X_test, y_test, epochs = 50, batchSize = 8, learningRate, reviewMode) {

    console.log(learningRate);

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
    noOfBatches = Math.ceil(y_train_flat_ordered.length / batchSize);
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

    if (!reviewMode) {
        console.log("Test2");
        console.log(epochs);
        trainingProcess = [];
        model.fit(X_train_T, y_train_T, {
            batchSize: batchSize,
            epochs: epochs,
            learningRate: learningRate,
            // shuffle: true,
            callbacks: {onEpochEnd: onEpochEnd, onBatchEnd: onBatchEnd, onTrainEnd: onTrainEnd},
        });
    } else {
        console.log("test");

        // $('#stepFilter').on('input', function () {
        //     let stepIdx = $('#stepFilter').val();
        //     let step = trainingProcess[stepIdx];
        //     let weights = step.weight;
        //     model.layers.forEach(function (layer, idx) {
        //         if (!layer.name.includes("flatten")) {
        //             let tWeight = [];
        //             weights[idx].data.forEach(function (w, sidx) {
        //                 // let arr = [];
        //                 // w.forEach(function (v) {
        //                 //     arr.push(v)
        //                 // });
        //                 let tempW = tf.tensor(Object.values(w), layer.getWeights()[sidx].shape);
        //                 tWeight.push(tempW);
        //             });
        //             layer.setWeights(tWeight);
        //         } else {
        //             layer.setWeights([]);
        //         }
        //         // console.log(layer.name, layer.getWeights()[0].dataSync());
        //     });
        //
        //     displayEpochData(model, trainLosses[testLosses.length - 1], testLosses[testLosses.length - 1]);
        // });

        plotTrainLossData(trainLosses, testLosses).then(() => {
            var canvas = document.getElementById("trainTestLossCanvas");

            let verticalPointerLine = d3.select('#trainTestLossSvg')
                .select("g")
                .append("line")
                .attr("class", "pointerLine")
                .attr("stroke", "black")
                .attr("stroke-opacity", 0.2)
                .attr("stroke-width", 2);

            let verticalPointerText = d3.select('#trainTestLossSvg')
                .select("g")
                .append("text")
                .attr("class", "pointerText")
                .attr("fill", "black")
                .attr("opacity", 0.5);

            function getPosition(obj) {
                var curleft = 0, curtop = 0;
                if (obj.offsetParent) {
                    do {
                        curleft += obj.offsetLeft;
                        curtop += obj.offsetTop;
                    } while (obj = obj.offsetParent);
                    return {x: curleft, y: curtop};
                }
                return undefined;
            }

            function getEpochAndBatch(canvasWidth, currentX) {
                let batch = currentX * batches / canvasWidth;
                let numOfBatchInEpoch = Math.ceil(y_train_flat_ordered.length / batchSize);
                let epoch = Math.floor(batch / numOfBatchInEpoch);
                let batchInEpoch = Math.floor(batch % numOfBatchInEpoch);
                return {epoch, batchInEpoch};
            }

            canvas.addEventListener("mousemove", function (e) {
                var pos = getPosition(this);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                var coord = "x=" + x + ", y=" + y;
                var c = this.getContext('2d');
                var p = c.getImageData(x, y, 1, 1).data;

                // If transparency on the image
                if ((p[0] === 0) && (p[1] === 0) && (p[2] === 0) && (p[3] === 0)) {
                    coord += " (Transparent color detected, cannot be converted to HEX)";
                }


                // var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);

                verticalPointerLine.attr("x1", x + 60)
                    .attr("y1", 20)
                    .attr("x2", x + 60)
                    .attr("y2", 160);

                let {epoch, batchInEpoch} = getEpochAndBatch(canvas.width, Math.max(x, 0));
                verticalPointerText.attr("transform", () => {
                    if (x > 580) {
                        return `translate(${x - 80},90)`
                    } else {
                        return `translate(${x + 65},90)`
                    }
                })
                    .text("Epoch: " + epoch + ", Batch: " + batchInEpoch);
            }, false);

            canvas.addEventListener("mouseover", function () {
                verticalPointerLine.style("display", "block");
                verticalPointerText.style("display", "block");
            });

            canvas.addEventListener("mouseout", function () {
                verticalPointerLine.style("display", "none");
                verticalPointerText.style("display", "none");
            });

            canvas.addEventListener("click", function (e) {
                var pos = getPosition(this);
                var x = e.pageX - pos.x;
                let numOfBatchInEpoch = Math.ceil(y_train_flat_ordered.length / batchSize);

                let {epoch, batchInEpoch} = getEpochAndBatch(canvas.width, Math.max(x, 0));
                if (epoch >= epochs) {
                    epoch = epochs - 1;
                    batchInEpoch = numOfBatchInEpoch - 1;
                }
                let selectBatchIdx = epoch * numOfBatchInEpoch + batchInEpoch;

                let stepIdx = selectBatchIdx;
                let step = trainingProcess[stepIdx];
                let weights = step.weight;
                model.layers.forEach(function (layer, idx) {
                    if (!layer.name.includes("flatten")) {
                        let tWeight = [];
                        weights[idx].data.forEach(function (w, sidx) {
                            let tempW = tf.tensor(Object.values(w), layer.getWeights()[sidx].shape);
                            tWeight.push(tempW);
                        });
                        layer.setWeights(tWeight);
                    } else {
                        layer.setWeights([]);
                    }
                });

                displayEpochData(model, trainLosses[stepIdx], testLosses[stepIdx]);
            });
        });
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
                drawTrainingWeights(getWeightsContainerId(i))
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
                getWeightsContainerId(containerId);
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
        //Enable the save/load buttons
        d3.select("#saveModelMenu").attr("disabled", null);
        d3.select("#loadModelMenu").attr("disabled", null);
        btnTrain.innerHTML = '<i class="material-icons right" id="playPausedIcon">play_arrow</i>Start';
        $("#trainingButtonContainer").addClass("paused");
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
                drawHeatmaps(data, "layerContainer" + timeStamp, "layer" + timeStamp, false);
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
                // plotTrainLossDetails();

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
        model.evaluate(sample_X_train_T, sample_y_train_T).data().then(trainRet => {
                let trainLoss = trainRet[0];
                model.evaluate(sample_X_test_T, sample_y_test_T).data().then(testRet => {
                    let testLoss = testRet[0];
                    trainLosses.push(trainLoss);
                    testLosses.push(testLoss);
                    plotTrainLossData(trainLosses, testLosses);
                    // let weights = [];
                    // model.layers.forEach(function (layer, idx) {
                    //     if (!layer.getConfig().name.includes("flatten")) {
                    //         let tWeight = [];
                    //         layer.getWeights().forEach(function (w) {
                    //             tWeight.push(w.dataSync());
                    //             // console.log(w.dataSync());
                    //         });
                    //         weights.push({name: layer.getConfig().name, data: tWeight});
                    //     } else {
                    //         weights.push({name: layer.getConfig().name, data: []});
                    //     }
                    // });
                    // trainingProcess.push({
                    //     batch: batch,
                    //     log: logs,
                    //     loss: {trainLoss: trainLoss, testLoss: testLoss},
                    //     weight: weights
                    // });
                });
            }
        );


        //TODO: This is slow, due to asynchronous behavior so putting it in epoch ends may have visual display bug, therefore we put it here, but it lowers the perf.
        if (Math.ceil(X_train.length / batchSize) > 1) {
            dispatch.call("changeWeightFilter");
        }
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
        currentEpoch = epoch + 1;

        model.evaluate(sample_X_train_T, sample_y_train_T).data().then(trainRet => {
                let trainLoss = trainRet[0];
                model.evaluate(sample_X_test_T, sample_y_test_T).data().then(testRet => {
                    let testLoss = testRet[0];
                    trainLosses.push(trainLoss);
                    testLosses.push(testLoss);
                    plotTrainLossData(trainLosses, testLosses);
                    let weights = [];
                    model.layers.forEach(function (layer, idx) {
                        if (!layer.getConfig().name.includes("flatten")) {
                            let tWeight = [];
                            layer.getWeights().forEach(function (w) {
                                tWeight.push(w.dataSync());
                                // console.log(w.dataSync());
                            });
                            weights.push({name: layer.getConfig().name, data: tWeight});
                        } else {
                            weights.push({name: layer.getConfig().name, data: []});
                        }
                    });
                    trainingProcess.push({
                        epoch: epoch,
                        log: logs,
                        loss: {trainLoss: trainLoss, testLoss: testLoss},
                        weight: weights
                    });
                    hideLoader();
                    displayEpochData(model, logs.loss);
                    // console.log(model.layers[0].getWeights()[0].dataSync());
                    if (epoch === 0) {
                        console.log("create network");
                        // createVarNetwork();
                    } else {
                        console.log("update network");
                        // updateVarNetwork();
                    }
                    if (epoch > 1) {
                        //We don't update for the first epoch
                        dispatch.call("changeWeightFilter");
                    }
                });

            }
        )
    }
}

function getLayerTrainingWeight(i) {
    let layerTrainingWeight = [];
    trainingProcess.forEach(function (batch) {
        let weight = batch.weight[i].data[0];
        if (weight)
            layerTrainingWeight = layerTrainingWeight.concat(Object.values(weight));
    });

    return layerTrainingWeight;
}

async function displayLayerWeights(model, i, containerId) {
    let layer = model.layers[i];
    let weights = layer.getWeights()[0];

    let layerTrainingWeight = getLayerTrainingWeight(i);
    let minStrokeWidth = 0,
        maxStrokeWidth = 3;

    if (layer.name.indexOf("lstm") >= 0) {
        let strokeWidthScale = d3.scaleLinear().domain([0, d3.max(layerTrainingWeight.map(d => d >= 0 ? d : -d))]).range([minStrokeWidth, maxStrokeWidth]);
        let opacityScale = d3.scaleLinear().domain(strokeWidthScale.domain()).range([minLineWeightOpacity, maxLineWeightOpacity]);
        let zeroOneScale = d3.scaleLinear().domain([0, d3.max(layerTrainingWeight.map(d => d >= 0 ? d : -d))]).range([0, 1]).clamp(true);

        buildWeightPositionDataV2(weights, heatmapH, 19, 100, 19, 100, 4, 10, 0, 3, minLineWeightOpacity, maxLineWeightOpacity, strokeWidthScale, opacityScale, zeroOneScale).then((result) => {
            weightsPathData[containerId] = result;//Store to use on click
            drawLSTMWeights(containerId);
            // updateVarNetwork();
        });
        buildTrainingWeightData(i, weights.shape, heatmapH, 19, 100, 19, 100, 4, 10, 0, 3, minLineWeightOpacity, maxLineWeightOpacity, isTraining ? currentEpoch : noOfEpochs, strokeWidthScale, opacityScale, zeroOneScale).then((result) => {
            trainingWeightsPathData[containerId] = result;
            drawTrainingWeights(containerId);
        });
    } else if (layer.name.indexOf("dense") >= 0 && i - 1 >= 0 && model.layers[i - 1].name.indexOf("flatten") >= 0) {//Is dense, but its previous one is flatten
        let flattenSplits = model.layers[i - 2].units;//Number of splits (divide weights in these number of splits then combine them in each split)

        buildTrainingWeightForFlattenLayer(i, flattenSplits, weights.shape).then((cumulativeTrainingWeights) => {
            let wShape = [flattenSplits, cumulativeTrainingWeights[0].length / flattenSplits];

            let newTrainingWeight = [];
            cumulativeTrainingWeights.forEach(function (d) {
                newTrainingWeight = newTrainingWeight.concat(Array.prototype.slice.call(d));
            });

            let strokeWidthScale = d3.scaleLinear().domain([0, d3.max(newTrainingWeight.map(d => d >= 0 ? d : -d))]).range([minStrokeWidth, maxStrokeWidth]);
            let opacityScale = d3.scaleLinear().domain(strokeWidthScale.domain()).range([minLineWeightOpacity, maxLineWeightOpacity]);
            let zeroOneScale = d3.scaleLinear().domain([0, d3.max(newTrainingWeight.map(d => d >= 0 ? d : -d))]).range([0, 1]).clamp(true);

            buildWeightForFlattenLayer(weights, flattenSplits).then(cumulativeT => {
                buildWeightPositionDataV2(cumulativeT, heatmapH, 19, 100, 19, 100, 1, 0, 0.5, 3, minLineWeightOpacity, maxLineWeightOpacity, strokeWidthScale, opacityScale, zeroOneScale).then((result) => {
                    weightsPathData[containerId] = result;
                    drawDenseWeights(containerId);
                });
            });

            buildTrainingWeightDataForFlatten(cumulativeTrainingWeights, wShape, heatmapH, 19, 100, 19, 100, 1, 10, 0, 3, minLineWeightOpacity, maxLineWeightOpacity, isTraining ? currentEpoch : noOfEpochs, strokeWidthScale, opacityScale, zeroOneScale).then((result) => {
                trainingWeightsPathData[containerId] = result;
                drawTrainingWeights(containerId);
            });

        });

    } else if (model.layers[i].name.indexOf("dense") >= 0) {//Remember this must be else if to avoid conflict with prev case.
        let strokeWidthScale = d3.scaleLinear().domain([0, d3.max(layerTrainingWeight.map(d => d >= 0 ? d : -d))]).range([minStrokeWidth, maxStrokeWidth]);
        let opacityScale = d3.scaleLinear().domain(strokeWidthScale.domain()).range([minLineWeightOpacity, maxLineWeightOpacity]);
        let zeroOneScale = d3.scaleLinear().domain([0, d3.max(layerTrainingWeight.map(d => d >= 0 ? d : -d))]).range([0, 1]).clamp(true);

        buildWeightPositionDataV2(weights, heatmapH, 19, 100, 19, 100, 1, 0, 0.5, 3, minLineWeightOpacity, maxLineWeightOpacity, strokeWidthScale, opacityScale, zeroOneScale).then((result) => {
            weightsPathData[containerId] = result;
            drawDenseWeights(containerId);
        });

        buildTrainingWeightData(i, weights.shape, heatmapH, 19, 100, 19, 100, 1, 10, 0, 3, minLineWeightOpacity, maxLineWeightOpacity, isTraining ? currentEpoch : noOfEpochs, strokeWidthScale, opacityScale, zeroOneScale).then((result) => {
            trainingWeightsPathData[containerId] = result;
            drawTrainingWeights(containerId);
        });
    }


    //Don't have to draw weights of flatten, will only use it next layer (model.layersConfig[i].name.indexOf("flatten"))

}

function toggleWeightsMenu() {
    //Toggle menu opacity.
    d3.selectAll(".lstmWeightType").attr("opacity", (d, i) => i === 0 ? 1 : 0.5 + 0.5 * lstmWeightTypeDisplay[i - 1]);//The first one is for click to toggle and will be visible by default
    d3.selectAll(".weightColor").attr("opacity", (d, i) => i === 0 ? 1 : 0.5 + 0.5 * weightTypeDisplay[i - 1]);//The first one is for click to toggle and will be visible by default
}

function makeFlattenTrainingWeights(result) {
    let flatten = [];
    result.lineData.filter(d => lstmWeightTypeDisplay[d.type] === 1 && weightTypeDisplay[d.weight > 0 ? 1 : 0] === 1).forEach(function (res) {
        res.paths.forEach(list => {
            flatten = flatten.concat(list)
        });
    });
    return flatten;
}

function drawTrainingWeights(containerId) {
    let result = trainingWeightsPathData[containerId];
    if (result) {
        d3.select("#training_" + containerId).selectAll(".trainingWeight")
            .data(makeFlattenTrainingWeights(result), d => d.idx)
            .join('path')
            .attr("class", "trainingWeight")
            .classed("weightLineTraining", isTraining)
            .attr("d", d => {
                return link(d)
            })
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
                showTip(`Epoch: ${d.epoch} weight: ${d.weight.toFixed(2)}`);
            })
            .on("mouseout", () => {
                hideTip();
            });
    }
}

function drawDenseWeights(containerId) {
    let result = weightsPathData[containerId];
    if (result) {
        d3.select("#" + containerId).selectAll(".weightLine")
            .data(result.lineData.filter(d => weightTypeDisplay[d.weight > 0 ? 1 : 0] === 1), d => d.idx, d => d.idx)
            .join('path')
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
            .data(result.lineData.filter(d => lstmWeightTypeDisplay[d.type] === 1 && weightTypeDisplay[d.weight > 0 ? 1 : 0] === 1), d => d.idx)
            .join('path')
            .attr("class", "weightLine")
            .classed("weightLineTraining", isTraining)
            .attr("d", d => link(d))
            .attr("fill", "none")
            // .attr("stroke", d => weightValueColorScheme[d.weight > 0 ? 1 : 0])
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

    drawColorScales(containerId);
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