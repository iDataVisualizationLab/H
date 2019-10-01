const path = require('path');
const express = require('express');
const logger = require('morgan');
const app = express();

var MongoClient = require('mongodb').MongoClient;
var db;

MongoClient.connect("mongodb://localhost:27017/", function (err, database) {
    if (err) throw err;

    db = database.db("TTUHSC");

    app.listen(3000);
    console.log("Listening on port 3000");
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