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
    showLoader();
    let model = await tf.loadLayersModel(`localstorage://${modelName}`);
    loadModelDataFromLocalStorage(modelName).then(modelData => {
        populateModelGUIFromData(model, modelData);
    });
}

async function loadModelFromServer(modelName) {
    showLoader();
    if (modelName.indexOf('L16L8L8D8D4') > -1) {
        modelName = 'l16l8l8d8d4/' + modelName;
    } else if (modelName.indexOf('L8L8D8D4') > -1) {
        modelName = 'l8l8d8d4/' + modelName;
    } else if (modelName.indexOf('L8L4D2') > -1) {
        modelName = 'l8l4d2/' + modelName;
    } else if (modelName.indexOf('L16L8L8D8D8') > -1) {
        modelName = 'l16l8l8d8d8/' + modelName;
    } else if (modelName.indexOf('ozone') > -1) {
        modelName = 'ozone/' + modelName;
    } else {
        modelName = 'large_model/' + modelName;
    }

    if (modelName.indexOf('stock') > -1) {
        features = ['Open', 'High', 'Low', 'Close', 'Volume'];
    } else if (modelName.indexOf('arrTemp') > -1) {
        features = ['CPU1 Temp', 'CPU2 Temp', 'Inlet Temp', 'CPU Load', 'Memory usage', 'Fan1 speed', 'Fan2 speed', 'Fan3 speed', 'Fan4 speed', 'Power consumption'];
    } else if (modelName.indexOf('emp') > -1) {
        features = ['Total_Nonfarm', 'Total_Private', 'Goods_Producing', 'Service_Providing', 'Manufacturing', 'Trade|Transportation|Utilities', 'Wholesale_Trade', 'Retail_Trade', 'Transportation|Warehousing|Utilities', 'Financial_Activities', 'Professional_and_Business_Services', 'Education|Health_Services', 'Leisure_and_Hospitality', 'Other_Services', 'Government'];
    } else if (modelName.indexOf('eeg') > -1) {
        features = ['feature 0', 'feature 1', 'feature 2', 'feature 3', 'feature 4'];
    } else if  (modelName.indexOf('ozone') > -1) {
        features = ['WSR0','WSR1','WSR2','WSR3','WSR4','WSR5','WSR6','WSR7','WSR8','WSR9','WSR10','WSR11','WSR12','WSR13','WSR14','WSR15','WSR16','WSR17','WSR18','WSR19','WSR20','WSR21','WSR22','WSR23','WSR_PK','WSR_AV','T0','T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12','T13','T14','T15','T16','T17','T18','T19','T20','T21','T22','T23','T_PK','T_AV','T85','RH85','U85','V85','HT85','T70','RH70','U70','V70','HT70','T50','RH50','U50','V50','HT50','KI','TT','SLP','SLP_','Precp'];
    }

    const model = await tf.loadLayersModel(`data/models/${modelName}.json`);
    //Now load data.
    d3.json(`data/models/${modelName}_data.json`).then(modelData => {
        populateModelGUIFromData(model, modelData);
        hideLoader();
    });
}

async function loadKerasModelFromServer(modelName) {
    showLoader();
    kerasModel = await tf.loadLayersModel(`data/models/${modelName}/model.json`);
    //Now load data.
    d3.json(`data/models/${modelName}/${modelName}_model_data.json`).then(modelData => {
        target_variable = modelName;
        populateModelGUIFromData(kerasModel, modelData);
        hideLoader();
    });
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