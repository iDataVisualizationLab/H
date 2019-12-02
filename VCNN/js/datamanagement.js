async function saveModelData(modelName, variableName, data, obj) {
    if (obj) {
        obj[variableName] = data;
    } else {
        return new Promise((resolve) => {
            localStorage.setItem(`${modelName}:${variableName}`, JSON.stringify(data));
        });
    }
}

async function loadModelData(modelName, variableName) {
    return new Promise((resolve) => {
        let ret = localStorage.getItem(`${modelName}:${variableName}`);
        resolve(ret ? JSON.parse(ret) : null);
    });
}

function saveModelClick() {
    if (!currentModel) {
        toast("There is no current model to save.");
        return true;
    }
    saveModel(true);
}

function saveModel(toFile) {
    let modelName = $("#modelName").val(),
        epochs = $("#epochs").val(),
        batchSize = $("#batchSize").val(),
        learningRate = $("#learningRate").val();

    let valid = true;
    if (!modelName) {
        toast("Please insert snapshot name");
        valid = false;
    }
    if (valid) {
        let obj = undefined;
        if (toFile) {
            obj = {};
        }
        //Save model config.
        saveModelData(modelName, "layersConfig", layersConfig, obj);
        saveModelData(modelName, "epochs", epochs, obj);
        saveModelData(modelName, "batchSize", batchSize, obj);
        saveModelData(modelName, "learningRate", learningRate, obj);
        //Save train loss data.
        saveModelData(modelName, "trainLosses", trainLosses, obj);
        saveModelData(modelName, "testLosses", testLosses, obj);
        saveModelData(modelName, "X_train", X_train, obj);
        saveModelData(modelName, "y_train", y_train, obj);
        saveModelData(modelName, "X_test", X_test, obj);
        saveModelData(modelName, "y_test", y_test, obj);
        saveModelData(modelName, "process", trainingProcess, obj);
        //Save the model
        if (toFile) {
            currentModel.save(`downloads://${modelName}`);
            download(JSON.stringify(obj), `${modelName}_data.json`, "text/plain");
        } else {
            //Save the model name
            saveModelName(modelName);
            currentModel.save(`localstorage://${modelName}`);
            toast("Saved model successfully!");
        }
    }
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function loadSavedModelNames() {
    let ret = localStorage.getItem("savedModels");
    return ret ? JSON.parse(ret) : [];
}

async function saveModelName(modelName) {
    return new Promise(resolve => {
        let savedModels = loadSavedModelNames();
        if (savedModels.indexOf(modelName) < 0) {
            savedModels.push(modelName);
            localStorage.setItem("savedModels", JSON.stringify(savedModels));
        }
    });
}

async function loadModelFromFiles(theElm) {
    const fileList = theElm.files;
    //Need to know which file is which.
    //Take the model name.
    let modelName;
    if (fileList.length != 3) {
        toast("Please select the three downloaded files.");
        return;
    }
    for (let i = 0; i < 3; i++) {
        let f = fileList[i];
        if (f.name.slice(f.name.length - 10, f.name.length - 4) === "_data.") {
            modelName = f.name.slice(0, f.name.length - 10);
            break;
        }
    }
    if (modelName) {
        let dataFile;
        let modelFile;
        let weightFile;
        for (let i = 0; i < 3; i++) {
            let f = fileList[i];
            if (f.name === modelName + "_data.json") {
                dataFile = f;
            }
            if (f.name === modelName + ".json") {
                modelFile = f;
            }
            if (f.name === modelName + ".weights.bin") {
                weightFile = f;
            }
        }
        if (!dataFile) {
            toast("Invalid data file uploaded");
            return;
        }
        if (!modelFile) {
            toast("Invalid model file uploaded");
            return;
        }
        if (!weightFile) {
            toast("Invalid weight file uploaded");
            return;
        }
        closeDialog("loadModelDialog");
        showLoader();
        //Now loading
        let model = await tf.loadLayersModel(tf.io.browserFiles(
            [modelFile, weightFile]));

        let reader = new FileReader();
        reader.onload = function (e) {
            let modelData = JSON.parse(e.target.result);
            populateModelGUIFromData(model, modelData);
            hideLoader();
        };
        reader.readAsText(dataFile);
    }
}

function loadModelDataFromObj(obj, variable) {
    return obj[variable];
}

async function loadModelDataFromLocalStorage(modelName) {
    let layersConfig_ = await loadModelData(modelName, "layersConfig");
    let epochs_ = await loadModelData(modelName, "epochs");
    let batchSize_ = await loadModelData(modelName, "batchSize");
    let trainLosses_ = await loadModelData(modelName, "trainLosses");
    let testLosses_ = await loadModelData(modelName, "testLosses");
    let X_train_ = await loadModelData(modelName, "X_train");
    let y_train_ = await loadModelData(modelName, "y_train");
    let X_test_ = await loadModelData(modelName, "X_test");
    let y_test_ = await loadModelData(modelName, "y_test");
    return {
        "layersConfig": layersConfig_,
        "epochs": epochs_,
        "batchSize": batchSize_,
        "trainLosses": trainLosses_,
        "testLosses": testLosses_,
        "X_train": X_train_,
        "y_train": y_train_,
        "X_test": X_test_,
        "y_test": y_test_
    };
}

async function loadModelFromLocalStorage(modelName) {
    let model = await tf.loadLayersModel(`localstorage://${modelName}`);
    loadModelDataFromLocalStorage(modelName).then(modelData => {
        populateModelGUIFromData(model, modelData);
    });
}

async function loadModelFromServer(modelName) {
    showLoader();
    if (modelName.indexOf('L16L8') > 0) {
        modelName = 'l16l8l8d8d4/' + modelName;
    } else if (modelName.indexOf('L8L8') > 0) {
        modelName = 'l8l8d8d4/' + modelName;
    } else {
        modelName = 'l8l4d2/' + modelName;
    }

    if (modelName.indexOf('stock') > 0) {
        features = ['Open','High', 'Low', 'Close', 'Volume'];
    } else {
        features = ['arrTemperature0', 'arrTemperature1', 'arrTemperature2', 'arrCPU_load0', 'arrMemory_usage0', 'arrFans_health0', 'arrFans_health1', 'arrFans_health2', 'arrFans_health3', 'arrPower_usage0'];
    }

    const model = await tf.loadLayersModel(`data/models/${modelName}.json`);
    //Now load data.
    d3.json(`data/models/${modelName}_data.json`).then(modelData => {
        populateModelGUIFromData(model, modelData);
        hideLoader();
    });
}

// async function loadAllPretrainModelFromServer(modelName) {
//     showLoader();
//     const model = await tf.loadLayersModel(`data/networkModel/${modelName}_model.json`);
//     //Now load data.
//     d3.json(`data/networkModel/${modelName}_model_data.json`).then(modelData => {
//         target_variable = modelName;
//
//         populateModelGUIFromData(model, modelData);
//         hideLoader();
//     });
// }

async function loadAllPretrainModelFromServer(modelName) {
    showLoader();
    const model = await tf.loadLayersModel(`data/models/l8l8d8d4/${modelName}.json`);
    //Now load data.
    console.log(modelName);

    d3.json(`data/models/l8l8d8d4/${modelName}_data.json`).then(modelData => {
        populateModelGUIFromData(model, modelData);
        hideLoader();
    });
}

async function loadAllPretrainKerasModelFromServer(modelName) {
    // showLoader();
    kerasModel = await tf.loadLayersModel(`data/selectedModel/${modelName}_ts${timeStep}/model.json`);
    //Now load data.
    // d3.json(`data/networkModel/${modelName}_model_data.json`).then(modelData => {
    //     target_variable = modelName;
    //     populateModelGUIFromData(model, modelData);
    //     hideLoader();
    // });
    let weights = await kerasModel.layers[0].getWeights()[0];
    kerasWeights = weights.dataSync();
    // updateVarNetwork();

}

async function loadAllPretrainModelFromServerV2(modelName) {
    showLoader();
    const model = await tf.loadLayersModel(`${modelName}.json`);
    //Now load data.
    d3.json(`${modelName}_data.json`).then(modelData => {
        populateModelGUIFromData(model, modelData);
        hideLoader();
    });
}