dispatch.on("change", () => {
    //If it is training toggle button
    // btnTrain.classList.remove("paused");
    btnTrain.innerHTML = '<i class="material-icons right" id="playPausedIcon">play_arrow</i>Start';
    $("#trainingButtonContainer").addClass("paused");
    stopTraining();
    currentModel = null;
});
dispatch.on("changeInput", () => {
    return new Promise(() => {
        //Remove the map object
        mapObjects = {};
        //Remove input
        d3.select("#inputContainer").selectAll("*").remove();
        //Remove weights out from input layer.
        d3.select("#layer0Weights").selectAll("*").each(sel => {
        });

        //Remove traintest loss
        d3.select("#trainTestLoss").selectAll("*").remove();
        //Remove output layer
        d3.select("#outputContainer").selectAll("*").remove();
        //Remove test container
        d3.select("#testContainer").selectAll("*").remove();
        //Remove all other layers.
        d3.selectAll(".layerContainer").selectAll("*").remove();
        d3.selectAll(".weightLine").remove();
        //Start from beginning
        processInputs(selectedFeatures);
    });
});

dispatch.on("changeWeightFilter", () => {
    let weightFilter = +$("#weightFilter").val();
    onWeightFilterChanged(weightFilter);
});

function loadLocalStorageModelChange(theElm) {
    loadModelChange("localstorage", theElm);
}

function loadServerModelChange(theElm) {
    loadModelChange("server", theElm);
}

function loadModelChange(sourceType, theElm) {
    //Reset the selected features to all features
    selectedFeatures = features.map(_=>true);
    let modelName = theElm.value;
    isTraining = false;
    if (sourceType === "server") {
        loadModelFromServer(modelName);
    } else if (sourceType === "localstorage") {
        loadModelFromLocalStorage(modelName);
    }
    closeDialog("loadModelDialog");
}

function populateModelGUIFromData(model, modelData) {
    let layersConfig_ = loadModelDataFromObj(modelData, "layersConfig");
    let epochs_ = loadModelDataFromObj(modelData, "epochs");
    let batchSize_ = loadModelDataFromObj(modelData, "batchSize");
    let learningRate_ = loadModelDataFromObj(modelData, "learningRate");
    let trainLosses_ = loadModelDataFromObj(modelData, "trainLosses");
    let testLosses_ = loadModelDataFromObj(modelData, "testLosses");
    let X_train_ = loadModelDataFromObj(modelData, "X_train");
    let y_train_ = loadModelDataFromObj(modelData, "y_train");
    let X_test_ = loadModelDataFromObj(modelData, "X_test");
    let y_test_ = loadModelDataFromObj(modelData, "y_test");
    let trainingProcess_ = loadModelDataFromObj(modelData, "process");


    // currentModel = model;//Don't do this coz we need to re-compile things if would like to continue to train from here
    // trainLosses = trainLosses_;
    // testLosses = testLosses_;
    trainingProcess = trainingProcess_;
    noOfEpochs = +epochs_;

    trainLosses = [];
    testLosses = [];
    trainingProcess_.forEach(function (d) {
        trainLosses.push(d.loss.trainLoss);
        testLosses.push(d.loss.testLoss);
    });
    //clear current map object (so we will redraw instead of updating)
    mapObjects = {};
    $("#epochs").val(epochs_);
    $("#batchSize").val(batchSize_);
    $("#learningRate").val(learningRate_);
    //Clear prev input
    d3.select("#inputContainer").selectAll("*").remove();
    //Clear prev output and test
    d3.select("#outputContainer").selectAll("*").remove();
    d3.select("#testContainer").selectAll("*").remove();
    //Clear also the training/testing loss chart.
    d3.select("#trainTestLoss").selectAll("*").remove();
    processData(X_train_, y_train_, X_test_, y_test_, () => {
        //Clear prev gui
        clearMiddleLayerGUI();
        reviewMode = true;
        layersConfig = layersConfig_;
        createTrainingGUI(layersConfig);

        //Draw the color scales for the intermediate outputs
        // drawColorScales(layersConfig);
        trainModel(model, X_train, y_train, X_test, y_test, epochs_, batchSize_, learningRate_,true);
    });
    return layersConfig;
}

function setTrainingConfigEditable(val) {
    //Enable the batch size, epochs form.
    $("#batchSize").prop("disabled", !val);
    $("#epochs").prop("disabled", !val);
    $("#learningRate").prop("disabled", !val);
    $('#loadModelMenu').attr("disabled", !val);
    $('#saveModelMenu').attr("disabled", !val);
}

function stopTraining() {
    isTraining = false;
    if (currentModel !== null) {
        currentModel.stopTraining = true;
    }
    setTrainingConfigEditable(true);
}

/***
 * Used to add layer from GUI (click button)
 */
function addLayer() {
    let layerType = $("#layerType").val();
    let units = +$("#noOfUnits").val();
    let activation = $("#activationType").val();
    let layerInfo = createLayer(layerType, units, activation);
    createLayerGUI(layerInfo);
}

function updateLayerInfo(layerInfo) {
    let layerType = $("#layerType").val();
    let units = +$("#noOfUnits").val();
    let activation = $("#activationType").val();
    layerInfo.layerType = layerType;
    layerInfo.units = units;
    layerInfo.activation = activation;
    updateLayerGUI(layerInfo);
}

function displayAddLayerDialog() {
    dispatch.call("change", null, undefined);
    //Change the title dialog.
    $("#changeLayerDialogTitle").text("Adding layer information");
    //Change the function call.
    $("#changeLayerDialogConfirm").unbind('click').click(addLayer);
    displayDialog("changeLayerDialog");
}

function displayUpdateLayerDialog(layerInfo) {

    dispatch.call("change", null, undefined);
    //Populate the dialog with current value.
    $("#layerType").val(layerInfo.layerType);
    //Need to re-initialize
    $("#layerType").formSelect();
    $("#noOfUnits").val(layerInfo.units);
    $("#activationType").val(layerInfo.activation);
    $("#activationType").formSelect();
    //Change the title.
    $("#changeLayerDialogTitle").text("Updating layer information");
    //Also update the function call
    $("#changeLayerDialogConfirm").unbind("click");//need to unbind the previous click function.
    $("#changeLayerDialogConfirm").on("click", () => {
        updateLayerInfo(layerInfo);
    });
    displayDialog("changeLayerDialog");
}

//Save model dialog
function displaySaveModelDialog() {
    if (!currentModel) {
        toast("There is no new model to save!");
        return;
    }
    displayDialog("saveModelDialog");
}

function populateLocalStorageModelNames() {
// Clean-up and repopulate the selection options.
    let dd = $("#modelsFromLocalStorage");
    dd.empty();
    dd.append($('<option value="" disabled selected>Choose your model</option>'));
    let savedModelNames = loadSavedModelNames();
    if (savedModelNames.length > 0) {
        savedModelNames.forEach(modelName => {
            dd.append($(`<option value='${modelName}'>${modelName}</option>`));
        });
    }
    //Need to reinitialize
    let selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
}

function displayLoadModelDialog() {
    dispatch.call("change", null, undefined);
    populateLocalStorageModelNames();
    displayDialog("loadModelDialog");
}

function displayDialog(dialogId) {
    let theElm = document.getElementById(dialogId);
    let dlg = M.Modal.getInstance(theElm);
    dlg.open();
}

function closeDialog(dialogId) {
    let theElm = document.getElementById(dialogId);
    let dlg = M.Modal.getInstance(theElm);
    dlg.close();
}