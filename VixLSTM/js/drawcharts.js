function drawHeatmapDetails(selector, d, data, shapValues, isInputLayer) {
    let theMapContainer = document.getElementById("mapDetailsContent");
    d3.select(theMapContainer).selectAll("*").remove();
    let hmData = mapObjects[selector + d].data;

    let yAxisValues = [];

    let flattenedZ = shapValues ? shapValues.flat().flat() : [1];
    let minShapValue = d3.min(flattenedZ);
    let maxShapValue = d3.max(flattenedZ);

    let maxBound = d3.max([Math.abs(minShapValue), Math.abs(maxShapValue)]);

    minShapValue = -maxBound;
    maxShapValue = maxBound;

    if (neuronShowingHeatmap) {
        yAxisValues = Array.from(new Array(hmData.y.length), (x, i) => i).filter((x, i) => i % 40 === 0);
    } else {
        for (let i = Math.floor(minShapValue); i <= Math.ceil(maxShapValue); i++) {
            yAxisValues.push(i);
        }
    }

    let hmSettings = {
        noSvg: true,
        showAxes: true,
        paddingLeft: 50,
        paddingRight: 50,
        paddingTop: 50,
        paddingBottom: 50,
        borderWidth: 0,
        title: {
            text: `Layer: ${data.layerName}, feature: ${data.layerName === "Input" ? features[d] : d}`
        },
        xAxisLabel: {
            text: "Sequence"
        },
        yAxisLabel: {
            text: dataItemName
        },
        showColorBar: true,
        haveBorder: false,
        width: 350,
        height: 350,
        //TODO: Should make these change automatically depending on the dataset.
        xTickValues: Array.from(new Array(hmData.x.length), (x, i) => i).filter((x, i) => i % 5 === 0),
        yTickValues: yAxisValues.filter(x => x % 20 === 0),
        minInputValue: isInputLayer ? minDataVal : -1,
        maxInputValue: isInputLayer ? maxDataVal : 1,
        minShapValue: minShapValue,
        maxShapValue: maxShapValue,
        isInputLayer: isInputLayer,
        reverseY: true
    };

    if (neuronShowingHeatmap) {
        let hm = new HeatMap(theMapContainer, hmData, hmSettings);
        hm.plot();
    } else {
        let hmTest = new LstmLineChart(theMapContainer, hmData, hmSettings);
        hmTest.plot();
    }

    let mapDetails = M.Modal.getInstance(document.getElementById("mapDetails"));
    mapDetails.open();
}

function showRelatedEntities(parent, timeStamp, neuronIdx) {
    if (timeStamp === -1) {
        let selector = "inputDiv";

        d3.selectAll(`.${selector}`).style("opacity", 0.02);
        let selectedNeuron = d3.select(`#${selector}${neuronIdx}`);
        selectedNeuron.style("opacity", 1);

        d3.select(`#training_layer0Weights`)
            .selectAll("path")
            .attr("opacity", d => d.sourceIdx === neuronIdx ? 1 : 0.02);

        d3.select(`#layer0Weights`)
            .selectAll(".weightLine")
            .attr("opacity", d => d.sourceIdx === neuronIdx ? 1 : 0.02);
    } else {
        let selector = "layer" + timeStamp;

        d3.selectAll(`.${selector}`).style("opacity", 0.02);
        let selectedNeuron = d3.select(`#${selector}${neuronIdx}`);
        selectedNeuron.style("opacity", 1);

        d3.select(`#training_weightsContainer${timeStamp}`)
            .selectAll("path")
            .attr("opacity", d => d.sourceIdx === neuronIdx ? 1 : 0.02);

        d3.select(`#weightsContainer${timeStamp}`)
            .selectAll(".weightLine")
            .attr("opacity", d => d.sourceIdx === neuronIdx ? 1 : 0.02);

        let previousTimeStamp = findPreviousLayerTimeStamp(timeStamp);

        let previousWeightsSelector = `#weightsContainer${previousTimeStamp}`;
        let previousTrainingSelector = `#training_weightsContainer${previousTimeStamp}`;

        if (previousTimeStamp === -1) {
            previousWeightsSelector = "#layer0Weights";
            previousTrainingSelector = "#training_layer0Weights";
        }

        d3.select(previousTrainingSelector)
            .selectAll("path")
            .attr("opacity", d => d.targetIdx === neuronIdx ? 1 : 0.02);

        d3.select(previousWeightsSelector)
            .selectAll(".weightLine")
            .attr("opacity", d => d.targetIdx === neuronIdx ? 1 : 0.02);
    }
}

function findPreviousLayerTimeStamp(timeStamp) {
    let previousTimeStamp = -1;
    layersConfig.find(function (d) {
        if (d.timeStamp === -1) return false;
        if (d.timeStamp === timeStamp) {
            return true;
        } else {
            previousTimeStamp = d.timeStamp;
            return false;
        }
    });

    return previousTimeStamp;
}

function undoShowRelatedEntities(parent, timeStamp, neuronIdx) {
    if (timeStamp === -1) {
        let selector = "inputDiv";

        d3.selectAll(`.${selector}`).style("opacity", 1);

        d3.select(`#training_layer0Weights`)
            .selectAll("path")
            .attr("opacity", 1);

        d3.select(`#layer0Weights`)
            .selectAll(".weightLine")
            .attr("opacity", 1);
    } else {
        let selector = "layer" + timeStamp;

        d3.selectAll(`.${selector}`).style("opacity", 1);

        d3.select(`#training_weightsContainer${timeStamp}`)
            .selectAll("path")
            .attr("opacity", 1);

        d3.select(`#weightsContainer${timeStamp}`)
            .selectAll(".weightLine")
            .attr("opacity", 1);

        let previousTimeStamp = findPreviousLayerTimeStamp(timeStamp);

        let previousWeightsSelector = `#weightsContainer${previousTimeStamp}`;
        let previousTrainingSelector = `#training_weightsContainer${previousTimeStamp}`;

        if (previousTimeStamp === -1) {
            previousWeightsSelector = "#layer0Weights";
            previousTrainingSelector = "#training_layer0Weights";
        }

        d3.select(previousTrainingSelector)
            .selectAll("path")
            .attr("opacity", 1);

        d3.select(previousWeightsSelector)
            .selectAll(".weightLine")
            .attr("opacity", 1);
    }
}

async function drawHeatmaps(data, shapValues, container, selector, timeStamp, isInputLayer) {
    let noOfItems = data.length;
    let noOfSteps = data[0].length;
    let noOfFeatures = data[0][0].length;
    //Generate steps
    let x = Array.from(Array(noOfSteps), (x, i) => i);
    //Generate items
    let y = Array.from(Array(noOfItems), (x, i) => i).reverse();//reverse since we sort from lower engine number to higher engine number
    //Generate div for the inputs
    let enters = d3.select(`#${container}`)
        .selectAll(`.${selector}`)
        .data(Array.from(Array(noOfFeatures), (x, i) => i), d => d).enter()
        .append("div")
        .style("width", "102px")
        .style("height", "152px");
    if (isInputLayer) {
        enters.style('transform', 'translate(0px,-25px)');
    }

    if (container === "inputContainer") {
        enters.append("div")
            .text((d, i) => features.filter((f, fi) => selectedFeatures[fi])[i])
            .style("color", "black")
            .style("font-size", "12px")
            .style("transform", 'translate(-65px, 85px) rotate(270deg)');
    }

    enters.append("div")
        .attr("class", selector)
        .attr("id", d => selector + d)
        // .style("margin-top", "15px")
        .style("margin-bottom", "0px")
        // .style("border", "1px solid black")
        .style("display", "inline-block")
        .on("click", (d) => {
            drawHeatmapDetails(selector, d, data, shapValues, isInputLayer);
        })
        .on("mouseover", (d) => {
            showRelatedEntities(enters, timeStamp, d);
        })
        .on("mouseout", (d) => {
            undoShowRelatedEntities(enters, timeStamp, d);
        })

    //Generate data.
    let averageLineArr = [];

    let flattenedZ = shapValues ? shapValues.flat().flat() : [1];
    let minShapValue = d3.min(flattenedZ);
    let maxShapValue = d3.max(flattenedZ);

    let maxBound = d3.max([Math.abs(minShapValue), Math.abs(maxShapValue)]);

    minShapValue = -maxBound;
    maxShapValue = maxBound;

    let minPosAreaShapValue = 0, maxPosAreaShapValue = 0;
    let minNegAreaShapValue = 0, maxNegAreaShapValue = 0;

    let areaChartList = [];

    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let z = [];
        let shap = [];
        let sumPositiveShap = [];
        let sumNegativeShap = [];
        for (let itemIdx = noOfItems - 1; itemIdx >= 0; itemIdx--) {//Reverse order of items from big (top) to small (bottom).
            let rowZ = [];
            let rowShap = [];
            for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
                rowZ.push(data[itemIdx][stepIdx][featureIdx]);
                rowShap.push(shapValues ? shapValues[itemIdx][stepIdx][featureIdx] : 0);
            }
            z.push(rowZ);
            shap.push(rowShap);
        }

        for (let i = 0; i < shap[0].length; i++) {
            let positive = 0;
            let negative = 0;
            let sum = 0;
            shap.forEach(instance => {
                // console.log(instance[i]);
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

        if (!mapObjects[selector + featureIdx]) {
            //Draw the feature.
            let hmSettings = {
                noSvg: true,
                showAxes: false,
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                borderWidth: 0,
                width: 100,
                height: heatmapH,
                minInputValue: isInputLayer ? minDataVal : -1,
                maxInputValue: isInputLayer ? maxDataVal : 1,
                minShapValue: minShapValue,
                maxShapValue: maxShapValue,
                isInputLayer: isInputLayer,
                haveBorder: true,
                reverseY: true
            };

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

            let hm = null;

            if (neuronShowingHeatmap) {
                hm = new HeatMap(document.getElementById(selector + featureIdx), {
                    x: x,
                    y: y,
                    z: z,
                    shap: shap,
                    isOutlier: isOutlierGlobal
                }, hmSettings);
            } else {
                hm = new LstmLineChart(document.getElementById(selector + featureIdx), {
                    x: x,
                    y: y,
                    z: z,
                    shap: shap,
                    isOutlier: isOutlierGlobal
                }, hmSettings);
            }

            areaChartList.push({
                'selector': selector + featureIdx,
                'container': document.getElementById(selector + featureIdx),
                'dataPositive': {x: x, y: sumPositiveShap},
                'dataNegative': {x: x, y: sumNegativeShap},
                'settings': areaSettings
            });

            hm.plot();
            mapObjects[selector + featureIdx] = hm;
        } else {
            let hm = mapObjects[selector + featureIdx];
            hm.update({x: x, y: y, z: z, shap: shap});
        }

        averageLineArr.push({data: calculateAverageLineForLstm({x: x, y: y, z: z}), idx: featureIdx});
    }
    areaChartList.forEach(function (item) {
        let positiveAreaSetting = item.settings;
        positiveAreaSetting.minShapValue = minPosAreaShapValue;
        positiveAreaSetting.maxShapValue = maxPosAreaShapValue;
        positiveAreaSetting.direction = 'up';
        let topArea = new AreaChart(item.container, item.dataPositive, positiveAreaSetting);
        topArea.plot();

        let negativeAreaSetting = item.settings;
        negativeAreaSetting.minShapValue = minNegAreaShapValue;
        negativeAreaSetting.maxShapValue = maxNegAreaShapValue;
        positiveAreaSetting.direction = 'down';
        let botArea = new AreaChart(item.container, item.dataNegative, negativeAreaSetting);
        botArea.plot();

        mapAreaObjects[item.selector] = {'positive': topArea, 'negative': botArea};

        rearrangeCharts(item.container, [1, 0, 2]);
    });

    // // findRelevantHiddenStates(0, data);
    // // if (container.indexOf('layer') > -1) {
    // hiddenStates[container] = data;
    // // }
    // neuronData.mse[container] = {};
    // neuronData.mse[container]['unsortedData'] = [];
    // neuronData.correlation[container] = {};
    // neuronData.correlation[container]['unsortedData'] = averageLineArr;
    //
    // sortNeuronByMse(container, averageLineArr);
    // sortNeuronByCorrelation(container, averageLineArr);
}

let globalError = {};
let globalSelected = {};

//Mean value of variables -> Euclidean
function calculateEuclideanDistanceV1(x, y) {
    let sum = 0;
    x.forEach(function (xVal, idx) {
        sum += Math.pow(mean(xVal) - mean(y[idx]), 2);
    });
    return Math.sqrt(sum);
}

//Euclidean of series -> sum eu of variales
function calculateEuclideanDistanceV2(x, y) {
    let sum = 0;
    for (let i = 0; i < x[0].length; i++) {
        let sumSquare = 0;
        x.forEach(function (xVal, idx) {
            sumSquare += Math.pow(xVal[i] - y[idx][i], 2);
        });

        sum += Math.sqrt(sumSquare);
    }
    return sum;
}

//Euclidean of variables -> sum eu of time step
function calculateEuclideanDistanceV3(x, y) {
    let sum = 0;

    x.forEach(function (xVal, idx) {
        let sumSquare = 0;
        xVal.forEach(function (vVal, vIdx) {
            sumSquare += Math.pow(vVal - y[idx][vIdx], 2);
        });

        sum += Math.sqrt(sumSquare);
    });

    return sum;
}

function findAllHiddenStatesByRanking() {
    let inputContainer = hiddenStates['inputContainer'];
    let firstHiddenStates = hiddenStates['layerContainer1'];
    let max = -1, idxMax = 0;
    for (let i = 0; i < inputContainer.length; i++) {
        for (let j = 0; j < inputContainer.length; j++) {
            if (i !== j) {
                let inputEu = calculateEuclideanDistanceV2(inputContainer[i], inputContainer[j]);
                let hiddenEu = calculateEuclideanDistanceV2(firstHiddenStates[i], firstHiddenStates[j]);
                let ratio = inputEu / hiddenEu;
                if (ratio > max) {
                    max = ratio;
                    idxMax = {'first': i, 'second': j}
                }
            }
        }
    }


    hiddenSimilarity = {'selected': idxMax.first, 'similar': idxMax.second};

    for (let neuron in mapObjects) {
        if (mapObjects[neuron].type === 'lstmheatmap') {
            let config = mapObjects[neuron];
            let htmlContainer = config.canvas.node().parentNode.parentNode;
            htmlContainer.removeChild(htmlContainer.firstChild);
            config.settings.xScale = null;
            config.settings.yScale = null;
            let newNeuron = new LstmLineChart(htmlContainer, config.data, config.settings);
            newNeuron.plot();
            mapObjects[neuron] = newNeuron;
        } else if (mapObjects[neuron].type === 'linechart') {
            let gContainer = d3.select(mapObjects[neuron].svg.node().parentNode)
                .select('.predictedContainer');
            gContainer.selectAll('g').select('text').attr('fill', function (d) {
                let color = d.isOutlier ? 'rgba(255,165,0,1)' : mapObjects[neuron].settings.colorScale('predicted');
                if (hiddenSimilarity.selected === d.index) {
                    color = 'red';
                } else if (hiddenSimilarity.similar === d.index) {
                    color = 'blue';
                }

                return color;
            })
        }
    }
}

function findRelevantHiddenStates(dataIdx) {

    // findAllHiddenStatesByRanking();

    for (let key in hiddenStates) {
        let min = 10000, idxMin = 0;
        let data = hiddenStates[key];
        let selectedHiddenState = data[dataIdx];
        data.forEach(function (hiddenState, idx) {
            if (idx !== dataIdx) {
                let distance = calculateEuclideanDistanceV2(selectedHiddenState, hiddenState);
                // calculateEuclideanDistanceV2(selectedHiddenState, hiddenState);
                if (distance < min) {
                    min = distance;
                    idxMin = idx;
                }
            }
        });

        hiddenSimilarity = {'selected': dataIdx, 'similar': idxMin};

        for (let neuron in mapObjects) {
            if (mapObjects[neuron].type === 'lstmheatmap') {
                let config = mapObjects[neuron];
                let htmlContainer = config.canvas.node().parentNode.parentNode;
                htmlContainer.removeChild(htmlContainer.firstChild);
                config.settings.xScale = null;
                config.settings.yScale = null;
                let newNeuron = new LstmLineChart(htmlContainer, config.data, config.settings);
                newNeuron.plot();
                mapObjects[neuron] = newNeuron;
            } else if (mapObjects[neuron].type === 'linechart') {
                let gContainer = d3.select(mapObjects[neuron].svg.node().parentNode)
                    .select('.predictedContainer');
                gContainer.selectAll('g').select('text').attr('fill', function (d) {
                    let color = d.isOutlier ? 'rgba(255,165,0,1)' : mapObjects[neuron].settings.colorScale('predicted');
                    if (hiddenSimilarity.selected === d.index) {
                        color = 'red';
                    } else if (hiddenSimilarity.similar === d.index) {
                        color = 'blue';
                    }

                    return color;
                })
            }
        }
    }
}

function recursiveFindingMse(mseMatrix, noOfNeurons, selected, isSelected, currentIdx, sumError, container) {
    for (let i = 0; i < noOfNeurons; i++) {
        if (!isSelected[i]) {
            isSelected[i] = true;
            selected[currentIdx] = i;
            if (currentIdx > 0) {
                sumError += mseMatrix[selected[currentIdx - 1]][i];
            }
            if (sumError > globalError[container]) {
                isSelected[i] = false;
                selected[currentIdx] = -1;
                if (currentIdx > 0) {
                    sumError -= mseMatrix[selected[currentIdx - 1]][i];
                }
                continue;
            }
            if (currentIdx === noOfNeurons - 1 && sumError < globalError[container]) {
                globalError[container] = sumError;
                globalSelected[container] = selected;
                selected.forEach(function (d, i) {
                    let newRow = {idx: d};
                    neuronData.mse[container]['sortedData'][i] = newRow;
                });
            } else {
                recursiveFindingMse(mseMatrix, noOfNeurons, selected, isSelected, currentIdx + 1, sumError, container);
            }
            isSelected[i] = false;
            selected[currentIdx] = -1;
            if (currentIdx > 0) {
                sumError += mseMatrix[selected[currentIdx - 1]][i];
            }
        }
    }
}

function recursiveFindingCorrelation(corrMatrix, noOfNeurons, selected, isSelected, currentIdx, sumCorr, container) {
    for (let i = 0; i < noOfNeurons; i++) {
        if (!isSelected[i]) {
            isSelected[i] = true;
            selected[currentIdx] = i;
            if (currentIdx > 0) {
                sumCorr += corrMatrix[selected[currentIdx - 1]][i];
            }

            if (sumCorr + (noOfNeurons - currentIdx - 1) <= globalError[container]) {
                isSelected[i] = false;
                selected[currentIdx] = -1;
                if (currentIdx > 0) {
                    sumCorr -= corrMatrix[selected[currentIdx - 1]][i];
                }
                continue;
            }

            if (currentIdx === noOfNeurons - 1 && sumCorr > globalError[container]) {
                globalError[container] = sumCorr;
                globalSelected[container] = selected;

                selected.forEach(function (d, i) {
                    let newRow = {idx: d};
                    neuronData.correlation[container]['sortedData'][i] = newRow;
                });
            } else {
                recursiveFindingCorrelation(corrMatrix, noOfNeurons, selected, isSelected, currentIdx + 1, sumCorr, container);
            }
            isSelected[i] = false;
            selected[currentIdx] = -1;
            if (currentIdx > 0) {
                sumCorr -= corrMatrix[selected[currentIdx - 1]][i];
            }
        }
    }
}

function sortNeuronByMse(container, averageLineArr) {
    let mseMatrix = [];
    let isSelected = [];
    for (let i = 0; i < averageLineArr.length; i++) {
        mseMatrix[i] = [];
        for (let j = 0; j < averageLineArr.length; j++) {
            if (i === j) {
                mseMatrix[i][j] = Infinity;
                continue;
            }
            let firstLine = averageLineArr[i].data;
            let secondLine = averageLineArr[j].data;
            let sse = 0;
            firstLine.forEach(function (ele, idx) {
                sse += Math.pow(ele - secondLine[idx], 2);
            });
            mseMatrix[i][j] = sse / firstLine.length;
        }
        isSelected.push(false);
    }
    let selected = [];
    globalSelected[container] = [];
    globalError[container] = 1000000;
    neuronData.mse[container]['sortedData'] = [];
    recursiveFindingMse(mseMatrix, averageLineArr.length, selected, isSelected, 0, 0, container);
}

function mean(arr) {
    let sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function calculateCrossCorrelation(x, y) {
    let mean_x = mean(x);
    let mean_y = mean(y);
    let s_xy = 0;
    let s_x = 0;
    let s_y = 0;
    x.forEach(function (xVal, idx) {
        s_xy += (xVal - mean_x) * (y[idx] - mean_y);
        s_x += Math.pow(xVal - mean_x, 2);
        s_y += Math.pow(y[idx] - mean_y, 2);
    });

    return s_xy / (Math.sqrt(s_x) * Math.sqrt(s_y));
}

function sortNeuronByCorrelation(container, averageLineArr) {
    let corrMatrix = [];
    let isSelected = [];
    for (let i = 0; i < averageLineArr.length; i++) {
        corrMatrix[i] = [];
        for (let j = 0; j < averageLineArr.length; j++) {
            if (i === j) {
                corrMatrix[i][j] = -1000000;
                continue;
            }
            let firstLine = averageLineArr[i].data;
            let secondLine = averageLineArr[j].data;

            corrMatrix[i][j] = calculateCrossCorrelation(firstLine, secondLine);
        }
        isSelected.push(false);
    }
    let selected = [];
    globalSelected[container] = [];
    globalError[container] = -1000000;
    neuronData.correlation[container]['sortedData'] = [];
    recursiveFindingCorrelation(corrMatrix, averageLineArr.length, selected, isSelected, 0, 0, container);
}

function calculateAverageLineForLstm(data) {
    let averageLine = [];
    data.x.forEach(function (xVal) {
        let sum = 0;
        data.y.forEach(function (yVal) {
            sum += data.z[yVal][xVal];
        });
        averageLine.push(sum / data.y.length);
    });

    return averageLine;
}

function drawLinechartDetails(selector, d, data, shapValues, isLayer) {
    let theMapContainer = document.getElementById("mapDetailsContent");
    d3.select(theMapContainer).selectAll("*").remove();
    let mData = mapObjects[selector + d].data;

    let flattenedZ = shapValues ? shapValues.flat().flat() : [1];
    let minShapValue = d3.min(flattenedZ);
    let maxShapValue = d3.max(flattenedZ);

    let maxBound = d3.max([Math.abs(minShapValue), Math.abs(maxShapValue)]);

    minShapValue = -maxBound;
    maxShapValue = maxBound;

    let mSettings = {
        noSvg: true,
        showAxes: true,
        paddingLeft: 50,
        paddingRight: 50,
        paddingTop: 50,
        paddingBottom: 50,
        borderWidth: 0,
        title: {
            text: (data.layerName === "Training output" || data.layerName === "Testing output") ? data.layerName : `Layer: ${data.layerName}, feature: ${d}`
        },
        xAxisLabel: {
            text: (data.layerName === "Training output" || data.layerName === "Testing output") ? predictedVariable : `${predictedVariable} (scaled)`
        },
        yAxisLabel: {
            text: dataItemName
        },
        showColorBar: true,
        yTicks: 10,
        colorScheme: data.layerName === "Testing output" ? testOutputColorScheme : outputColorScheme,
        legend: {
            x: 60,
            y: 60
        },
        width: 350,
        height: 350,
        minShapValue: minShapValue,
        maxShapValue: maxShapValue,
        fillWhite: false,
        isLayer: false
    };

    // mSettings.fillWhite = false;

    let lc = new LineChart(theMapContainer, mData, mSettings);
    lc.plot();

    let mapDetails = M.Modal.getInstance(document.getElementById("mapDetails"));
    mapDetails.open();
}

function detectOutlierByMAE(y, y_predicted, topPercentage) {
    let isOutlier = [];
    let mae_array = [];
    y.forEach((d, idx) => {
        let mae = Math.abs(d - y_predicted[idx]);
        mae_array.push({mae: mae, idx: idx});
        isOutlier.push(false);
    });
    mae_array.sort((a, b) => b.mae - a.mae);

    let topIdx = Math.ceil(mae_array.length * topPercentage / 100);
    for (let i = 0; i < topIdx; i++) {
        isOutlier[mae_array[i].idx] = true;
    }
    isOutlierGlobal = isOutlier;
    return isOutlier;
}

async function drawLineCharts(data, shapValues, normalizer, target, container, selector, lineChartSettings, noBorder) {
    let noOfItems = data.length;
    let noOfFeatures = data[0].length;
    let isLayer = container.indexOf('layer') > -1;
    //Generate steps
    let y = Array.from(Array(noOfItems), (yV, i) => i);
    //Generate div for the inputs
    let elms = d3.select(`#${container}`)
        .selectAll(`.${selector}`)
        .data(Array.from(Array(noOfFeatures), (x, i) => i), d => d)
        .enter()
        .append("div")
        .style("width", "102px")
        .style("height", isLayer ? "152px" : "auto");

    elms = elms.append("div")
        .attr("class", selector)
        .attr("id", d => selector + d)
        // .style("margin-top", "15px")
        .on("click", (d) => {
            if (container.indexOf('layer') > -1) {
                drawLinechartDetails(selector, d, data, shapValues, isLayer);
            }
        });


    if (typeof noBorder === 'undefined' || !noBorder) {
        elms.style("display", "inline-block");
    }
    let isOutlier = isOutlierGlobal;
    if (!normalizer && container === 'outputContainer') {
        isOutlier = detectOutlierByMAE(target, data, 5);
    } else if (container === 'testContainer') {
        isOutlier = null;
    }
    //Generate data.
    let averageLineArr = [];

    let flattenedZ = shapValues ? shapValues.flat().flat() : [1];
    let minShapValue = d3.min(flattenedZ);
    let maxShapValue = d3.max(flattenedZ);

    let maxBound = d3.max([Math.abs(minShapValue), Math.abs(maxShapValue)]);

    minShapValue = -maxBound;
    maxShapValue = maxBound;

    let minPosAreaShapValue = 0, maxPosAreaShapValue = 0;
    let minNegAreaShapValue = 0, maxNegAreaShapValue = 0;

    let areaChartList = [];

    lineChartSettings.minShapValue = minShapValue;
    lineChartSettings.maxShapValue = maxShapValue;

    if (selector.indexOf('trainTestLoss') > -1 || selector.indexOf('output') > -1 || selector.indexOf('test') > -1) {
        lineChartSettings.fillWhite = false;
    } else {
        lineChartSettings.fillWhite = true;
    }

    lineChartSettings.isLayer = isLayer;

    console.log(container);

    let newXDelta = 2 / 22;
    let newX = [];
    for (let i = -11; i <= 11; i++) {
        newX.push(newXDelta * i);
    }

    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let x = [];
        let shap = [];
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            x.push(data[itemIdx][featureIdx]);
            shap.push(shapValues ? shapValues[itemIdx][featureIdx] : 0);
        }

        x = normalizer ? normalizer(x, -1.0, 1.0) : x;
        const lineChartData = [
            {
                x: x,
                y: y,
                shap: shap,
                isOutlier: isOutlier,
                series: 'predicted',
                marker: 'o',
                type: 'scatter'
            }
        ];

        // if (!isLayer) {
            lineChartData.push({
                x: target,
                y: y,
                shap: shap,
                series: 'actual',
                marker: 'x',
                type: 'scatter'
            });
        // }

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
            xScale: d3.scaleLinear().domain([-1, 1]).range([0, 100])
        };

        let sumPositiveShap = Array.from(new Array(newX.length), (x, i) => 0);
        let sumNegativeShap = Array.from(new Array(newX.length), (x, i) => 0);
        x.forEach(function (value, index) {
            let valueSign = value / Math.abs(value);
            let position = Math.ceil(Math.abs(value) / newXDelta);
            let shapValue = shap[index];
            if (shapValue > 0) {
                sumPositiveShap[valueSign * position + 11] += shapValue;
            } else {
                sumNegativeShap[valueSign * position + 11] += Math.abs(shapValue);
            }
        });

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

        if (!mapObjects[selector + featureIdx]) {
            if (document.getElementById(selector + featureIdx) === null) {//In case the layer is deleted, delete the data and move on.
                delete (mapObjects[selector + featureIdx]);
                console.log("continued");
                continue;
            }

            let lc = new LineChart(document.getElementById(selector + featureIdx), lineChartData, lineChartSettings);

            if (isLayer) {
                areaChartList.push({
                    'selector': selector + featureIdx,
                    'container': document.getElementById(selector + featureIdx),
                    'dataPositive': {x: newX, y: sumPositiveShap},
                    'dataNegative': {x: newX, y: sumNegativeShap},
                    'settings': areaSettings
                });
            }

            lc.plot();
            mapObjects[selector + featureIdx] = lc;
        } else {
            let lc = mapObjects[selector + featureIdx];
            lc.update(lineChartData);
        }
        averageLineArr.push({data: x, idx: featureIdx});
    }

    areaChartList.forEach(function (item) {
        let positiveAreaSetting = item.settings;
        positiveAreaSetting.minShapValue = minPosAreaShapValue;
        positiveAreaSetting.maxShapValue = maxPosAreaShapValue;
        positiveAreaSetting.direction = 'up';
        let topArea = new AreaChart(item.container, item.dataPositive, positiveAreaSetting);
        topArea.plot();

        let negativeAreaSetting = item.settings;
        negativeAreaSetting.minShapValue = minNegAreaShapValue;
        negativeAreaSetting.maxShapValue = maxNegAreaShapValue;
        positiveAreaSetting.direction = 'down';
        let botArea = new AreaChart(item.container, item.dataNegative, negativeAreaSetting);
        botArea.plot();

        mapAreaObjects[item.selector] = {'positive': topArea, 'negative': botArea};

        rearrangeCharts(item.container, [1, 0, 2]);
    });


    // if (normalizer) {
    //     neuronData.mse[container] = {};
    //     neuronData.mse[container]['unsortedData'] = [];
    //     neuronData.correlation[container] = {};
    //     neuronData.correlation[container]['unsortedData'] = averageLineArr;
    //
    //     sortNeuronByMse(container, averageLineArr);
    //     sortNeuronByCorrelation(container, averageLineArr);
    // }
}

function sortTwoArrayByIndex(x, y) {
    let index = [];
    for (let i = 0; i < x.length; i++) {
        index.push(i);
    }

    let n = x.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (x[index[j]] < x[index[j + 1]]) {
                let temp = index[j];
                index[j] = index[j + 1];
                index[j + 1] = temp;
            }
        }
    }
    let sortedX = [], sortedY = [];
    index.forEach(i => {
        sortedX.push(x[i]);
        sortedY.push(y[i]);
    });

    return {sortedX, sortedY};
}

function updateGraphTitle(graphId, newText) {
    let theNode = d3.select("#" + graphId).select(".graphTitle").node();
    theNode.innerHTML = newText;
}

function plotColorBar(theSvg, colorScale, id, width, height, orientation) {
    const domain = colorScale.domain();
    const minVal = domain[0];
    const maxVal = domain[domain.length - 1];

    const linearScale = d3.scaleLinear()
        .range([minVal, maxVal])
        .domain([0, width]);

    theSvg.selectAll(".bars")
        .data(d3.range(width), d => d)
        .enter()
        .append("rect")
        .attr("class", "bars")
        .attr("x", function (d, i) {
            return i;
        })
        .attr("y", 0)
        .attr("height", height)
        .attr("width", 1)
        .style("fill", function (d) {
            return colorScale(linearScale(d));
        });


    let axisG = theSvg.append("g").attr("transform", `translate(0,${height})`);
    let axisScale = d3.scaleLinear().domain(d3.extent(domain)).range([0, width]);
    let axisBottom = d3.axisBottom().scale(axisScale).ticks(5);
    axisG.call(axisBottom);
}

// async function buildWeightPositionData(weightsT, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity) {
//     return new Promise((resolve, reject) => {
//         let weightData = weightsT.dataSync();
//         let strokeWidthScale = d3.scaleLinear().domain([0, d3.max(weightData.map(d => d >= 0 ? d : -d))]).range([minStrokeWidth, maxStrokeWidth]);
//         let opacityScaler = d3.scaleLinear().domain(strokeWidthScale.domain()).range([minOpacity, maxOpacity]);
//         let zeroOneScaler = d3.scaleLinear().domain([0, d3.max(weightData.map(d => d >= 0 ? d : -d))]).range([0, 1]).clamp(true);
//         let lineData = [];
//
//         let wShape = weightsT.shape;
//         let noOfLeftNodes = wShape[0];
//         noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
//         spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;
//
//         let noOfRightNodes = wShape[1] / noOfWeightTypes;
//
//         for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
//             let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2;
//             let leftNodeStartY = leftNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
//             for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
//                 let rightNodeCenterY = rightIdx * (rightNodeHeight + rightNodeMarginTop) + (rightNodeHeight + rightNodeMarginTop) / 2;
//                 let rightNodeStartY = rightNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
//                 for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
//                     let leftNodeY = leftNodeStartY + typeIdx * spanForWeightTypes;
//                     let rightNodeY = rightNodeStartY + typeIdx * spanForWeightTypes;
//                     let idx = leftIdx * (wShape[1]) + typeIdx * noOfRightNodes + rightIdx;
//                     let item = {
//                         source: {
//                             x: 0,
//                             y: leftNodeY
//                         },
//                         target: {
//                             x: weightWidth,
//                             y: rightNodeY
//                         },
//                         sourceIdx: leftIdx,
//                         targetIdx: rightIdx,
//                         idx: idx,
//                         type: typeIdx,
//                         weight: weightData[idx],
//                         scaledWeight: zeroOneScaler(weightData[idx] > 0 ? weightData[idx] : -weightData[idx])
//                     };
//                     lineData.push(item);
//                     // //TODO: may not break, but for now break for better performance
//                     // break;
//                 }
//             }
//         }
//
//         resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScaler});
//     });
// }

async function buildTrainingWeightData(i, wShape, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity, epochs, strokeWidthScale, opacityScale, zeroOneScale) {
    return new Promise((resolve, reject) => {
        let lineData = [];

        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;

        let noOfRightNodes = wShape[1] / noOfWeightTypes;

        let noOfWeights = wShape[1];
        let spanForWeightsLeft = leftNodeHeight / noOfWeights;

        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2;
            let leftNodeStartY = leftNodeCenterY - leftNodeHeight / 2 + spanForWeightsLeft / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                let rightNodeCenterY = rightIdx * (rightNodeHeight + rightNodeMarginTop) + (rightNodeHeight + rightNodeMarginTop) / 2;
                let rightNodeStartY = rightNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;

                for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
                    let idx = leftIdx * wShape[1] + typeIdx * noOfRightNodes + rightIdx;
                    let idxInNode = idx % wShape[1];
                    let leftNodeY = leftNodeStartY + idxInNode * spanForWeightsLeft;
                    let rightNodeY = rightNodeStartY + typeIdx * spanForWeightTypes;
                    let spanForEpochs = weightWidth / epochs;
                    let pathList = [];
                    let weightList = [];

                    for (let epoch = 0; epoch < epochs; epoch++) {
                        // let epochIdx = epoch * noOfBatches + noOfBatches - 1;
                        let weightData = trainingProcess[epoch].weight[i].data[0];
                        weightList.push(weightData[idx]);
                    }
                    weightList.forEach(function (value, index) {
                        pathList.push({
                            source: {
                                x: spanForEpochs * index,
                                y: leftNodeY
                            },
                            target: {
                                x: spanForEpochs * (index + 1),
                                y: leftNodeY
                            },
                            weight: value,
                            scaledWeight: zeroOneScale(value > 0 ? value : -value),
                            epoch: index,
                            sourceIdx: leftIdx,
                            targetIdx: rightIdx
                        });
                    });
                    let item = {
                        paths: pathList,
                        sourceIdx: leftIdx,
                        targetIdx: rightIdx,
                        idx: idx,
                        type: typeIdx,
                    };
                    lineData.push(item);
                }
            }
        }
        resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScale});
    })
}

async function buildTrainingWeightDataV2(i, wShape, isLeftNodeLSTM, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity, epochs, strokeWidthScale, opacityScale, zeroOneScale, weightTypeIdx) {
    return new Promise((resolve, reject) => {
        let lineData = [];

        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;

        let noOfRightNodes = wShape[1] / noOfWeightTypes;

        let noOfWeights = wShape[1] / noOfWeightTypes;

        // let leftNodeMainChartHeight = isLeftNodeLSTM ? 100 : leftNodeHeight;
        let leftNodeMainChartHeight = 100;
        let spanForWeightsLeft = leftNodeMainChartHeight / (noOfWeights + 5);

        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeMarginTop) / 2;
            // if (isLeftNodeLSTM) {
            //     leftNodeCenterY += 25;
            // }
            leftNodeCenterY += 25;

            let leftNodeStartY = leftNodeCenterY + 6 * spanForWeightsLeft / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                let idx = leftIdx * wShape[1] + weightTypeIdx * noOfRightNodes + rightIdx;
                let idxInNode = idx % noOfWeights;
                let leftNodeY = leftNodeStartY + idxInNode * spanForWeightsLeft;
                let spanForEpochs = weightWidth / epochs;
                let pathList = [];
                let weightList = [];

                for (let epoch = 0; epoch < epochs; epoch++) {
                    // let epochIdx = epoch * noOfBatches + noOfBatches - 1;
                    let weightData = trainingProcess[epoch].weight[i].data[0];
                    weightList.push(weightData[idx]);
                }
                weightList.forEach(function (value, index) {
                    pathList.push({
                        source: {
                            x: spanForEpochs * index,
                            y: leftNodeY
                        },
                        target: {
                            x: spanForEpochs * (index + 1),
                            y: leftNodeY
                        },
                        weight: value,
                        scaledWeight: zeroOneScale(value > 0 ? value : -value),
                        epoch: index,
                        sourceIdx: leftIdx,
                        targetIdx: rightIdx
                    });
                });
                let item = {
                    paths: pathList,
                    sourceIdx: leftIdx,
                    targetIdx: rightIdx,
                    idx: idx,
                    type: weightTypeIdx,
                };
                lineData.push(item);
            }
        }
        resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScale});
    })
}

async function buildTrainingWeightDataForFlatten(cumulativeTrainingWeights, wShape, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity, epochs, strokeWidthScale, opacityScale, zeroOneScale) {
    return new Promise((resolve, reject) => {
        let lineData = [];

        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;

        let noOfRightNodes = wShape[1] / noOfWeightTypes;

        let noOfWeights = wShape[1];

        //hard code fix
        let spanForWeightsLeft = 100 / (noOfWeights + 5);


        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            //hard code fix
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2 + 25;
            let leftNodeStartY = leftNodeCenterY - leftNodeHeight / 2 + 6 * spanForWeightsLeft / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
                    let idx = leftIdx * wShape[1] + typeIdx * noOfRightNodes + rightIdx;
                    let idxInNode = idx % wShape[1];
                    let leftNodeY = leftNodeStartY + idxInNode * spanForWeightsLeft;
                    let spanForEpochs = weightWidth / epochs;
                    let pathList = [];
                    let weightList = [];

                    for (let epoch = 0; epoch < epochs; epoch++) {
                        let weightData = cumulativeTrainingWeights[epoch];

                        weightList.push(weightData[idx]);
                    }

                    weightList.forEach(function (value, index) {
                        pathList.push({
                            source: {
                                x: spanForEpochs * index,
                                y: leftNodeY
                            },
                            target: {
                                x: spanForEpochs * (index + 1),
                                y: leftNodeY
                            },
                            weight: value,
                            scaledWeight: zeroOneScale(value > 0 ? value : -value),
                            epoch: index,
                            sourceIdx: leftIdx,
                            targetIdx: rightIdx,
                            type: typeIdx,
                        });
                    });


                    let item = {
                        paths: pathList,
                        sourceIdx: leftIdx,
                        targetIdx: rightIdx,
                        idx: idx,
                        type: typeIdx,
                    };
                    lineData.push(item);
                }
            }
        }
        resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScale});
    })
}

function sortNeuronByWeightsSum(noOfLeftNodes, noOfRightNodes, noOfWeightTypes, weightData, wShape) {
    let nodeWeightSumArray = [];
    for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
        let nodeWeightSum = 0;
        for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
            if (noOfWeightTypes === 4) {
                nodeWeightSum += weightData[leftIdx * (wShape[1]) + 3 * noOfRightNodes + rightIdx];
            } else {
                nodeWeightSum += weightData[leftIdx * (wShape[1]) + rightIdx];
            }
        }
        nodeWeightSumArray.push({weightSum: nodeWeightSum, idx: leftIdx});
    }
    nodeWeightSumArray.sort((a, b) => b.weightSum - a.weightSum);
    return nodeWeightSumArray;
}

async function buildWeightPositionDataV2(weightsT, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity, strokeWidthScale, opacityScale, zeroOneScale) {
    return new Promise((resolve, reject) => {
        let weightData = weightsT.dataSync();
        let lineData = [];

        let wShape = weightsT.shape;
        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;

        let noOfRightNodes = wShape[1] / noOfWeightTypes;

        let noOfWeights = wShape[1];

        let spanForWeightsLeft = leftNodeHeight / noOfWeights;
        let topPadding = (noOfLeftNodes - noOfRightNodes) * neuronHeight / 2;

        let nodeWeightSumArray = sortNeuronByWeightsSum(noOfLeftNodes, noOfRightNodes, noOfWeightTypes, weightData, wShape);

        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2;
            let leftNodeStartY = leftNodeCenterY - leftNodeHeight / 2 + spanForWeightsLeft / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                let rightNodeCenterY = rightIdx * (rightNodeHeight + rightNodeMarginTop) + (rightNodeHeight + rightNodeMarginTop) / 2;
                let rightNodeStartY = rightNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
                for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
                    let idx = leftIdx * (wShape[1]) + typeIdx * noOfRightNodes + rightIdx;
                    let idxInNode = idx % wShape[1];
                    let leftNodeY = leftNodeStartY + idxInNode * spanForWeightsLeft;
                    let rightNodeY = topPadding + rightNodeStartY + typeIdx * spanForWeightTypes;

                    let item = {
                        source: {
                            x: 0,
                            y: leftNodeY
                        },
                        target: {
                            x: weightWidth,
                            y: rightNodeY
                        },
                        sourceIdx: leftIdx,
                        targetIdx: rightIdx,
                        idx: idx,
                        type: typeIdx,
                        weight: weightData[idx],
                        scaledWeight: zeroOneScale(weightData[idx] > 0 ? weightData[idx] : -weightData[idx])
                    };
                    lineData.push(item);
                    // //TODO: may not break, but for now break for better performance
                }
            }
        }

        resolve({
            lineData: lineData,
            strokeWidthScale: strokeWidthScale,
            sortedData: nodeWeightSumArray,
            unsortedData: []
        });
    });
}

async function buildWeightForFlattenLayer(weightsT, noOfLeftNodes) {
    return new Promise((resolve, reject) => {
        let cumulativeT = tf.tensor(weightsT.split(noOfLeftNodes).map(t => {
            let arr = t.cumsum().arraySync();
            return arr[arr.length - 1];
        }));
        resolve(cumulativeT);
    });
}

async function buildTrainingWeightForFlattenLayer(i, noOfLeftNodes, shape) {
    let cumulativeTrainingWeights = [];
    for (let idx = 0; idx < trainingProcess.length; idx++) {
        let epoch = trainingProcess[idx];
        let weight = tf.tensor(Object.values(epoch.weight[i].data[0]), shape);
        let newWeight = await buildWeightForFlattenLayer(weight, noOfLeftNodes);
        cumulativeTrainingWeights.push(newWeight.dataSync());
    }
    return cumulativeTrainingWeights;
}

function normalizeTarget(data, min2, max2) {
    const min1 = d3.min(data);
    const max1 = d3.max(data);
    const range1 = max1 - min1;
    const range2 = max2 - min2;
    const result = data.map(d => {
        if (range1 === 0) {
            return (min2 + max2) / 2.0;
        }
        return min2 + ((d - min1) / range1) * range2;
    });
    return result;
}