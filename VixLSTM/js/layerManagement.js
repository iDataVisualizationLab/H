let layersConfig = [];

function createDefaultLayers() {
    // createLayer("lstm", 16, "default", 0);
    createLayer("lstm", 16, "default", 0);
    createLayer("lstm", 16, "default", 1);
    createLayer("lstm", 12, "default", 2);
    createLayer("lstm", 12, "default", 3);
    createLayer("lstm", 8, "default", 4);
    createLayer("dense", 8, "default", 5);
    createLayer("dense", 4, "default", 6);
}


/**
 * Used to create a layer in the background, push it to the array of layersConfig and return it.
 * @param layerType
 * @param units
 * @param activation
 * @returns {{layerType: *, id: string, units: *, activation: *}}
 */
function createLayer(layerType, units, activation, timeStamp) {
    if (timeStamp === undefined) {
        timeStamp = new Date().getTime();
    }
    let idVal = "layer" + timeStamp;
    let layerInfo = {
        id: idVal,
        timeStamp: timeStamp,
        layerType: layerType,
        units: units,
        activation: activation
    };

    //if the input layer already exists (add it before that).
    if (layersConfig.find(l => l.id === "output")) {
        layersConfig.splice(layersConfig.length - 1, 0, layerInfo);
    } else {
        layersConfig.push(layerInfo);
    }
    return layerInfo;
}

function calculateNetworkHeight() {
    let maxNoNeurons = X_train[0][0].length;
    layersConfig.forEach(function (layer) {
        if (maxNoNeurons < layer.units) {
            maxNoNeurons = layer.units
        }
    });

    return neuronHeight * maxNoNeurons;
}

/**
 * Used to create GUI for the layer
 * @param layerInfo
 */
function createLayerGUI(layerInfo) {
    let colNum = getCSSVariable("--colNum");
    colNum += 1;
    setCSSVariable("--colNum", colNum);
    let layerInfoStr = getLayerInfo(layerInfo);
    let idVal = layerInfo.id;
    //Create the div.
    let div = $(`<div class='grid-item' id="${idVal}">
                    <a class="btn-small btn-floating"><i class="material-icons" onclick="deleteLayer('${idVal}')">delete</i></a> <span id="layerInfoStr${idVal}">${layerInfoStr}</span>
                    <div class="divider" style="margin-bottom: 5px;"></div>
                    <div class="row" >
                         <svg style="overflow: visible; margin-left: 10px;" height="25">
                             <g id="colorScale${layerInfo.timeStamp}"></g>
                         </svg>
                    </div>
                    <div class="divider" style="margin-bottom: 10px; margin-top: 5px;"></div>
                    <div class="row valign-wrapper " style="height: ${networkHeight + "px"}">
                    <div class="layerBox" style="height: ${networkHeight+"px"}">
                        </div>
                    <div style="width: 100%">
                    
                    <div class="col s5 layerContainer" id="layerContainer${layerInfo.timeStamp}">
                     </div>
                        <div class="col s7 trainingWeightsContainer left">
                            <svg id="training_weightsContainer${layerInfo.timeStamp}" transform="translate(0,5)" width="139.125" style="overflow: visible"></svg>
                        </div>`+
                        // `<div class="col s5 weightsContainer right">
                        //     <svg id="weightsContainer${layerInfo.timeStamp}" transform="translate(0,5)" width="100" style="overflow: visible"></svg>
                        // </div>`+
                    `</div>
                        
                     </div>
                 </div>`);
    if (layerInfo.id === layersConfig[layersConfig.length-2].id) {
        div = $(`<div class='grid-item' id="${idVal}">
                    <a class="btn-small btn-floating"><i class="material-icons" onclick="deleteLayer('${idVal}')">delete</i></a> <span id="layerInfoStr${idVal}">${layerInfoStr}</span>
                    <div class="divider" style="margin-bottom: 5px;"></div>
                    <div class="row" >
                         <svg style="overflow: visible; margin-left: 10px;" height="25">
                             <g id="colorScale${layerInfo.timeStamp}"></g>
                         </svg>
                    </div>
                    <div class="divider" style="margin-bottom: 10px; margin-top: 5px;"></div>
                    <div class="row valign-wrapper " style="height: ${networkHeight + "px"}">
                    <div class="layerBox" style="height: ${networkHeight+"px"}">
                        </div>
                    <div style="width: 100%">
                    
                    <div class="col s5 layerContainer" id="layerContainer${layerInfo.timeStamp}">
                     </div>
                        <div class="col s4 trainingWeightsContainer left">
                            <svg id="training_weightsContainer${layerInfo.timeStamp}" transform="translate(0,5)" width="80" style="overflow: visible"></svg>
                        </div>`+
            `<div class="col s3 weightsContainer right">
                            <svg id="weightsContainer${layerInfo.timeStamp}" transform="translate(0,5)" width="49.125" style="overflow: visible"></svg>
                        </div>`+
            `</div>
                        
                     </div>
                 </div>`);
    }
    div.insertBefore($("#layerOutput"));
}

function updateLayerGUI(layerInfo) {
    let idVal = layerInfo.id;
    let layerInfoStr = getLayerInfo(layerInfo);
    $(`#layerInfoStr${idVal}`).html(layerInfoStr);
}

function clearMiddleLayerGUI() {
    $(".grid-item").each((i, elm) => {
        if (elm.id === "variable-network") return;
        if (elm.id !== "layerInput" && elm.id !== "layerOutput") {
            removeLayerGUI(elm.id);
        } else if (elm.id === "layerInput") {
            let layer0WeightContainer = d3.select("#" + getWeightsContainerId(0));
            layer0WeightContainer.selectAll("g").remove();
            layer0WeightContainer.selectAll("weightLine").remove();
        }
    });
}

function getLayerInfo(layerInfo) {
    let result = "";
    if (layerInfo.layerType === "lstm") {
        result = `<b><a href="#" onclick="updateLayer('${layerInfo.id}')">LSTM (${layerInfo.units} units)</a></b><br/>x-axis: output sequences<br/>y-axis: engines`;
    } else if (layerInfo.layerType === "dense") {
        result = `<b><a href="#" onclick="updateLayer('${layerInfo.id}')">Dense (${layerInfo.units} units)</a></b><br/>x-axis: output values<br/>y-axis: engines`
    }
    return result;
}

function updateLayer(layerId) {
    //Populate the add laye
    let layerInfo = layersConfig.find(l => l.id === layerId);
    displayUpdateLayerDialog(layerInfo);
}

function removeLayerGUI(id) {
    let colNum = getCSSVariable("--colNum");
    colNum -= 1;
    setCSSVariable("--colNum", colNum);
    $(`#${id}`).remove();
}

function deleteLayer(id, onSuccess) {
    console.log(id)
    removeLayer(id);
    removeLayerGUI(id);
    if (onSuccess) {
        onSuccess();
    }
    dispatch.call("change", null, undefined);
}

function removeLayer(id) {
    let layerIdx = layersConfig.findIndex(l => l.id === id);
    console.log(layerIdx)
    if (layersConfig[layerIdx].layerType === 'lstm') {
        layersConfig.splice(layerIdx, 1);
    }
    layersConfig.splice(layerIdx, 1);
}