const path = require('path');
const express = require('express');
const logger = require('morgan');
const app = express();
const port = process.env.PORT || 80;

var MongoClient = require('mongodb').MongoClient;
var db;

MongoClient.connect("mongodb+srv://ttuhsc:ttuhsc123@ttuhsc-3yay2.mongodb.net/test?retryWrites=true&w=majority", function (err, database) {
    if (err) throw err;

    db = database.db("TTUHSC");

    app.listen(port);
    console.log("Listening on port "+port);
});

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/blog/all', function (req, res) {
    var cursor = db.collection('blog').find();
    var results = {query: "get-all-blog", data: []};

    cursor.each(function (err, doc) {
        if (doc != null) {
            results.data.push(doc);
        }
    });

    setTimeout(function () {
        res.send(results);
    }, 500);
});

app.get('/api/profile/all', function (req, res) {
    var cursor = db.collection('profile').find();
    var results = {query: "get-all-profile", data: []};

    cursor.each(function (err, doc) {
        if (doc !== null)
            results.data.push(doc);
    });

    setTimeout(function () {
        res.send(results);
    }, 500);
});

app.post('/api/blog/create', function (req, res) {
    var store = "";
    req.on('data', function (data) {
        store += data;
    });

    req.on('end', function () {
        res.send("OK")
    })
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/home.html'));
});


app.get('*', function (req, res) {
    res.redirect('/bubble.html');
});

function getNextSequenceValue(sequenceName) {
    var sequenceDocument = db.counters.findAndModify({
        query: {_id: sequenceName},
        update: {$inc: {sequence_value: 1}},
        new: true
    });

    return sequenceDocument.sequence_value;
}