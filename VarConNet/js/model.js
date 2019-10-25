let layersConfig = [];
let target_variable = "arrTemperature0";
let start_time, end_time;
let trainLoss = [];

async function startTraining() {
  start_time = new Date();
  var result = await trainLstmModel(X_train, y_train);
  result.model.summary();
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

async function trainLstmModel(X_train, y_train) {
  const rnn_input_layer_features = 10;
  const rnn_input_layer_timesteps = 20;
  const rnn_input_shape = [rnn_input_layer_timesteps, rnn_input_layer_features];
  const rnn_output_neurons = 4;
  const output_layer_shape = rnn_output_neurons;
  const output_layer_neurons = 1;

  const xs = tf.tensor(X_train);
  const ys = tf.tensor(y_train);
  const xsVal = tf.tensor(X_test);
  const ysVal = tf.tensor(y_test);

  console.log("Start training " + target_variable);

  const model = tf.sequential();

  var lstm_cells = [];
  const n_layers = 2;

  for (let index = 0; index < n_layers; index++) {

    lstm_cells.push(tf.layers.lstmCell({units: rnn_output_neurons}));

  }

  model.add(tf.layers.rnn({cell: lstm_cells, inputShape: rnn_input_shape, returnSequences: false}));
  model.add(tf.layers.dense({units: 4, inputShape: [output_layer_shape]}));
  model.add(tf.layers.dense({units: 1, inputShape: [4], activation: 'relu'}));


  const rnn_batch_size = 8;

  const epochs = $("#epochs").val();
  const lr = $("#learning-rate").val();
  const batch = $("#batch-size").val();

  console.log(lr);

  const opt_adam = tf.train.adam(lr);

  model.compile({optimizer: opt_adam, loss: 'meanSquaredError'});

  const hist = await model.fit(xs, ys,
    {
      batchSize: batch,
      epochs: epochs,
      validattionData: [xsVal, ysVal],
      callbacks:
        {
          onEpochEnd: async (epoch, logs) => {
            console.log(epoch);
            console.log(logs);
          },
          onBatchEnd: async  (batch, logs) => {
            console.log(epoch);
            console.log(logs);
            updateLossChart(logs.loss)
          }
        }
    });

  return {model: model, stats: hist};
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
