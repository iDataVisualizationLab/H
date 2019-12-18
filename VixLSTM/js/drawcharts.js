function drawHeatmapDetails(selector, d, data, isInputLayer) {
    let theMapContainer = document.getElementById("mapDetailsContent");
    d3.select(theMapContainer).selectAll("*").remove();
    let hmData = mapObjects[selector + d].data;

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
        width: 350,
        height: 350,
        //TODO: Should make these change automatically depending on the dataset.
        xTickValues: Array.from(new Array(hmData.x.length), (x, i) => i).filter((x, i) => i % 5 === 0),
        yTickValues: Array.from(new Array(hmData.y.length), (x, i) => i).filter((x, i) => i % 20 === 0),
        minValue: isInputLayer ? minDataVal : -1,
        maxValue: isInputLayer ? maxDataVal : 1,
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

async function drawHeatmaps(data, container, selector, timeStamp, isInputLayer) {
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
        .style("width", "100px");
    if (container === "inputContainer") {
        enters.append("div")
            .text((d, i) => features.filter((f, fi) => selectedFeatures[fi])[i])
            .style("color", "black")
            .style("font-size", "10px")
            .style("height", "10px")
            .style("width", "100px")
            .style("text-align", "center");

        enters.append("div")
            .attr("class", selector)
            .attr("id", d => selector + d)
            .style("margin-top", "5px")
            .style("margin-bottom", "0px")
            .style("border", "1px solid black")
            .style("display", "inline-block")
            .on("click", (d) => {
                drawHeatmapDetails(selector, d, data, true);
            })
            .on("mouseover", (d) => {
                showRelatedEntities(enters, timeStamp, d);
            })
            .on("mouseout", (d) => {
                undoShowRelatedEntities(enters, timeStamp, d);
            });
    } else {
        enters.append("div")
            .attr("class", selector)
            .attr("id", d => selector + d)
            .style("margin-top", "15px")
            .style("margin-bottom", "0px")
            .style("border", "1px solid black")
            .style("display", "inline-block")
            .on("click", (d) => {
                drawHeatmapDetails(selector, d, data, false);
            })
            .on("mouseover", (d) => {
                showRelatedEntities(enters, timeStamp, d);
            })
            .on("mouseout", (d) => {
                undoShowRelatedEntities(enters, timeStamp, d);
            })
    }
    //Generate data.
    let averageLineArr = [];

    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let z = [];
        for (let itemIdx = noOfItems - 1; itemIdx >= 0; itemIdx--) {//Reverse order of items from big (top) to small (bottom).
            let row = [];
            for (let stepIdx = 0; stepIdx < noOfSteps; stepIdx++) {
                row.push(data[itemIdx][stepIdx][featureIdx])
            }
            z.push(row);
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
                minValue: isInputLayer ? minDataVal : -1,
                maxValue: isInputLayer ? maxDataVal : 1,
                isInputLayer: isInputLayer,
                reverseY: true
            };
            // if (selector == "inputDiv") {
            //     hmSettings.title = {text: features[featureIdx], fontSize: 6};
            // } else {
            //     hmSettings.title = {text: 'neuron' + featureIdx, fontSize: 6};
            // }

            if (neuronShowingHeatmap) {
                let hm = new HeatMap(document.getElementById(selector + featureIdx), {x: x, y: y, z: z}, hmSettings);
                hm.plot();
                mapObjects[selector + featureIdx] = hm;
            } else {
                let hm = new LstmLineChart(document.getElementById(selector + featureIdx), {
                    x: x,
                    y: y,
                    z: z
                }, hmSettings);
                hm.plot();
                mapObjects[selector + featureIdx] = hm;
            }
        } else {
            let hm = mapObjects[selector + featureIdx];
            hm.update({x: x, y: y, z: z});
        }
        averageLineArr.push({data: calculateAverageLineForLstm({x: x, y: y, z: z}), idx: featureIdx});
    }
    neuronData[container] = {};
    neuronData[container]['unsortedData'] = averageLineArr;
    sortNeuronByMse(container, averageLineArr);
}

let globalError = {};
let globalSelected = {};

function recursiveFinding(mseMatrix, noOfNeurons, selected, isSelected, currentIdx, sumError, container) {
    for (let i = 0; i < noOfNeurons; i++) {
        if (!isSelected[i]) {
            isSelected[i] = true;
            selected[currentIdx] = i;
            if (currentIdx > 0) {
                sumError += mseMatrix[selected[currentIdx - 1]][currentIdx];
            }
            if (sumError > globalError[container]) {
                isSelected[i] = false;
                selected[currentIdx] = -1;
                return
            }
            if (currentIdx === noOfNeurons - 1 && sumError < globalError[container]) {
                globalError[container] = sumError;
                globalSelected[container] = selected;
                selected.forEach(function (d, i) {
                    let newRow = {idx: d};
                    neuronData[container]['sortedData'][i] = newRow;
                });
                console.log(globalError);
                console.log(globalSelected);
            } else {
                recursiveFinding(mseMatrix, noOfNeurons, selected, isSelected, currentIdx + 1, sumError, container);
            }
            isSelected[i] = false;
            selected[currentIdx] = -1;
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
    neuronData[container]['sortedData'] = [];
    recursiveFinding(mseMatrix, averageLineArr.length, selected, isSelected, 0, 0, container);
}

function mean(arr) {
    let sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function calculateCrossCorrelation(first) {

}

function sortNeuronByCorrelation(container, averageLineArr) {
    let corrMatrix = [];
    let isSelected = [];
    for (let i = 0; i < averageLineArr.length; i++) {
        corrMatrix[i] = [];
        for (let j = 0; j < averageLineArr.length; j++) {
            if (i === j) {
                corrMatrix[i][j] = Infinity;
                continue;
            }
            let firstLine = averageLineArr[i].data;
            let secondLine = averageLineArr[j].data;
            let meanFirstLine = mean(firstLine);
            let meanSecondLine = mean(secondLine);

            // corrMatrix[i][j] = ;
            // corrMatrix[j][i] = corrMatrix[i][j];
        }
        isSelected.push(false);
    }
    let selected = [];
    globalSelected[container] = [];
    globalError[container] = 1000000;
    neuronData[container]['sortedData'] = [];
    recursiveFinding(mseMatrix, averageLineArr.length, selected, isSelected, 0, 0, container);
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

function calculateAverageLineForDense(data) {
    console.log(data);

}

function drawLinechartDetails(selector, d, data) {
    let theMapContainer = document.getElementById("mapDetailsContent");
    d3.select(theMapContainer).selectAll("*").remove();
    let mData = mapObjects[selector + d].data;
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
        height: 350
    };

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

async function drawLineCharts(data, normalizer, target, container, selector, lineChartSettings, noBorder) {
    let noOfItems = data.length;
    let noOfFeatures = data[0].length;

    //Generate steps
    let y = Array.from(Array(noOfItems), (yV, i) => i);
    //Generate div for the inputs
    let elms = d3.select(`#${container}`).selectAll(`.${selector}`).data(Array.from(Array(noOfFeatures), (x, i) => i), d => d)
        .enter().append("div").attr("class", selector).attr("id", d => selector + d).style("margin-top", "15px")
        .on("click", (d) => {
            drawLinechartDetails(selector, d, data);
        });

    if (typeof noBorder === 'undefined' || !noBorder) {
        elms.style("border", "1px solid black").style("display", "inline-block");
    }
    let isOutlier = isOutlierGlobal;
    if (!normalizer && container === 'outputContainer') {
        isOutlier = detectOutlierByMAE(target, data, 5);
    } else if (container === 'testContainer') {
        isOutlier = null;
    }
    //Generate data.
    let averageLineArr = [];

    for (let featureIdx = 0; featureIdx < noOfFeatures; featureIdx++) {
        let x = [];
        for (let itemIdx = 0; itemIdx < noOfItems; itemIdx++) {
            x.push(data[itemIdx][featureIdx]);
        }
        x = normalizer ? normalizer(x, -1.0, 1.0) : x;
        const lineChartData = [
            {
                x: x,
                y: y,
                isOutlier: isOutlier,
                series: 'output',
                marker: 'o',
                type: 'scatter'
            },
            {
                x: target,
                y: y,
                series: 'target',
                marker: 'x',
                type: 'scatter'
            }
        ];
        if (!mapObjects[selector + featureIdx]) {
            if (document.getElementById(selector + featureIdx) === null) {//In case the layer is deleted, delete the data and move on.
                delete (mapObjects[selector + featureIdx]);
                console.log("continued");
                continue;
            }
            let lc = new LineChart(document.getElementById(selector + featureIdx), lineChartData, lineChartSettings);
            lc.plot();
            mapObjects[selector + featureIdx] = lc;
        } else {
            let lc = mapObjects[selector + featureIdx];
            lc.update(lineChartData);
        }
        // averageLineArr.push({data: calculateAverageLineForDense({x: x, y: y}), idx: featureIdx});
    }
    // if (container !== 'outputContainer' && container !== 'testContainer') {
    //     neuronData[container] = {};
    //     neuronData[container]['unsortedData'] = averageLineArr;
    //     sortNeuronByMse(container, averageLineArr);
    // }
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

async function buildWeightPositionData(weightsT, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity) {
    return new Promise((resolve, reject) => {
        let weightData = weightsT.dataSync();
        let strokeWidthScale = d3.scaleLinear().domain([0, d3.max(weightData.map(d => d >= 0 ? d : -d))]).range([minStrokeWidth, maxStrokeWidth]);
        let opacityScaler = d3.scaleLinear().domain(strokeWidthScale.domain()).range([minOpacity, maxOpacity]);
        let zeroOneScaler = d3.scaleLinear().domain([0, d3.max(weightData.map(d => d >= 0 ? d : -d))]).range([0, 1]).clamp(true);
        let lineData = [];

        let wShape = weightsT.shape;
        let noOfLeftNodes = wShape[0];
        noOfWeightTypes = noOfWeightTypes ? noOfWeightTypes : 1;
        spanForWeightTypes = spanForWeightTypes ? spanForWeightTypes : 0;

        let noOfRightNodes = wShape[1] / noOfWeightTypes;

        for (let leftIdx = 0; leftIdx < noOfLeftNodes; leftIdx++) {
            let leftNodeCenterY = leftIdx * (leftNodeHeight + leftNodeMarginTop) + (leftNodeHeight + leftNodeMarginTop) / 2;
            let leftNodeStartY = leftNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
            for (let rightIdx = 0; rightIdx < noOfRightNodes; rightIdx++) {
                let rightNodeCenterY = rightIdx * (rightNodeHeight + rightNodeMarginTop) + (rightNodeHeight + rightNodeMarginTop) / 2;
                let rightNodeStartY = rightNodeCenterY - (noOfWeightTypes - 1) * spanForWeightTypes / 2;
                for (let typeIdx = 0; typeIdx < noOfWeightTypes; typeIdx++) {
                    let leftNodeY = leftNodeStartY + typeIdx * spanForWeightTypes;
                    let rightNodeY = rightNodeStartY + typeIdx * spanForWeightTypes;
                    let idx = leftIdx * (wShape[1]) + typeIdx * noOfRightNodes + rightIdx;
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
                        scaledWeight: zeroOneScaler(weightData[idx] > 0 ? weightData[idx] : -weightData[idx])
                    };
                    lineData.push(item);
                    // //TODO: may not break, but for now break for better performance
                    // break;
                }
            }
        }

        resolve({lineData: lineData, strokeWidthScale: strokeWidthScale, opacityScaler: opacityScaler});
    });
}

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

async function buildTrainingWeightDataForFlatten(cumulativeTrainingWeights, wShape, leftNodeHeight, leftNodeMarginTop, rightNodeHeight, rightNodeMarginTop, weightWidth, noOfWeightTypes, spanForWeightTypes, minStrokeWidth, maxStrokeWidth, minOpacity, maxOpacity, epochs, strokeWidthScale, opacityScale, zeroOneScale) {
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
            opacityScaler: opacityScale,
            sortedData: nodeWeightSumArray,
            originalData: []
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