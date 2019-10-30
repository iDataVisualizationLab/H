let layersConfig = [];
let target_variable = "arrTemperature0";
let start_time, end_time;
let trainLoss = [];
let bestModel = null;
let bestResults = 100000;

async function startTraining() {
  start_time = new Date();
  var result = await trainLstmModel();
  result.summary();
  let predicted = predict(X_test, result.model);

  let ss = 0;
  let mse = 0;

  predicted.forEach(function (num, i) {
    ss += Math.pow(num - y_test[i], 2);
  });

  mse = ss / predicted.length;
  end_time = new Date();

  console.log("MSE: " + mse);
  let training_time = end_time - start_time;
  console.log("Training time: " + training_time);

  showResult(training_time, mse);
}

async function trainLstmModel() {
  let inputShape = [X_train[0].length, X_train[0][0].length];

  const xs = tf.tensor(X_train);
  const ys = tf.tensor(y_train);
  const xsVal = tf.tensor(X_test);
  const ysVal = tf.tensor(y_test);

  console.log("Start training " + target_variable);

  const model = tf.sequential();

  model.add(tf.layers.lstm({units: 4, inputShape: inputShape, returnSequences: true}));
  // model.add(tf.layers.lstm({units:4, inputShape: inputShape, returnSequences: true}));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({units: 2}));
  model.add(tf.layers.dense({units: 1}));


  const epochs = $("#epochs").val();
  const lr = $("#learning-rate").val();
  const batch = $("#batch-size").val();

  console.log(lr);

  const opt_adam = tf.train.adam(lr);

  model.compile({optimizer: opt_adam, loss: 'meanSquaredError'});


  await model.fit(xs, ys,
    {
      batchSize: +batch,
      epochs: +epochs,
      validationData: [xsVal, ysVal],
      callbacks:
        {
          onEpochEnd: async (epoch, logs) => {
            console.log(epoch);
            console.log(logs);
          },
          onBatchEnd: async (batch, logs) => {
            updateLossChart(logs.loss)
          }
        }
    });

  await model.save('downloads://trainedModel/' + target_variable);

  return model;
}

function splitKFold(k, i) {
  let numRecordOfFold = X_train.length / k;

}

function updateLossChart(loss) {

}

function predict(X_test, model) {
  const outps = model.predict(tf.tensor(X_test));

  return Array.from(outps.dataSync());
}

function showResult(time, loss) {
  $('#train-time').text(time);
  $('#test-loss').text(loss);
}

function StandardScaler(data) {

}

function shiftData(data, target) {

}
