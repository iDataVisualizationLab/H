const tf = require('@tensorflow/tfjs');
const tfc = require('@tensorflow/tfjs-converter');
const modelPath = 'C:\\Users\\hp\\Downloads\\models\\newModelm.hdf5';
const model = tfc.loadGraphModel(`file://${modelPath}`, {
    weightNames: [],
});

const modelJSON = model.toJSON(null, false);
const modelJSONString = JSON.stringify(modelJSON);
const outputFilePath = 'C:\\Users\\hp\\Downloads\\models\\model.json';
const fs = require('fs');
fs.writeFileSync(outputFilePath, modelJSONString);
