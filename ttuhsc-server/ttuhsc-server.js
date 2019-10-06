const path = require('path');
const express = require('express');
const logger = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 80;
const router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var db;
var sess;
var users = [];

MongoClient.connect("mongodb+srv://ttuhsc:ttuhsc123@ttuhsc-3yay2.mongodb.net/test?retryWrites=true&w=majority", function (err, database) {
    if (err) throw err;

    db = database.db("TTUHSC");

    updateUsers();

    app.listen(port);
    console.log("Listening on port " + port);
});

app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'fd15244472166709fc2c1bcbe6e6a2e1', saveUninitialized: true, resave: true, expires: new Date(Date.now() + (30*60*1000))}));

app.post('/api/signin', (req, res) => {
    sess = req.session;
    const loginUser = {email: req.body.email, password: req.body.password};
    if (checkUser(loginUser)) {
        res.status(200);
        res.end();
    } else {
        res.status(401);
        res.end();
    }
});

app.get('/api/user', function (req, res) {
   sess = req.session;
   if (sess.uid) {
       res.status(200);
       res.send({id: sess.uid, email: sess.email})
   } else {
       res.status(402);
       res.send({});
   }
});

app.get('/api/blog-create-container', function (req, res) {
    sess = req.session;
    if (sess.uid) {
        res.end(
            `<div class="row col-12 form-group form-inline" id="create-post-form">` +
            `<a href='single.html' class='img img-2' style="background-image: url('img/user_male.png');"></a>` +
            `<textarea class="col-10 form-control" id="name" rows="3" placeholder="Post new blog ..."></textarea>` +
            `</div>` +
            `<div class="row col-12 button-container">` +
            `<div style="display: none">`+
            `<input type="file" id="fileInput" name="fileInput" />`+
            `</div>`+
            /*`<button class="btn btn-success" id="upload">Upload Image</button>` +*/
            `<button class="btn btn-success" id="post">Post</button>` +
            `</div>`
        )
    } else {
        res.end(
            `<div class="row col-12 button-container" id="signin-form">` +
            `<button type="button" class="btn btn-info" data-toggle="modal" data-target="#signInModal">Sign In</button>` +
            `<div class="middle-text">OR</div>` +
            `<button type="button" class="btn btn-info" data-toggle="modal" data-target="#signUpModal">Sign Up </button>` +
            `</div>`
        )
    }
});

app.get('/api/create-comment-form', function (req, res) {
    sess = req.session;
    if (sess.uid) {
        res.end(
            `<a href='single.html' class='img img-2' style="background-image: url('img/user_male.png');"></a>` +
            `<textarea class="col-11 form-control input-comment" rows="1" onkeypress="keyEvent(this, event)"></textarea>`
        )
    } else {
        res.end(
            `<p class="comment-signin">Sign in to comment</p>`
        )
    }
});

app.post('/api/comment/create', (req, res) => {
    sess = req.session;
    if (sess.uid) {
        console.log(req.body)
        res.end('OK')
    } else res.redirect('/bubble.html');
});

app.get('/test-login', function (req, res) {
    sess = req.session;
    if (sess.uid) {
        res.end("You have signed in");
    } else {
        res.end("You have not signed in");
    }
});

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

app.get('*', function (req, res) {
    sess = req.session;
    if (sess.email) {
        return res.redirect('/bubble.html');
    }
    res.end("You have not signed in yet")


    // res.redirect('/bubble.html');
});

function getNextSequenceValue(sequenceName, callback) {
    db.collection('counters').findOneAndUpdate(
        {"_id": sequenceName},
        {$inc: {sequence_value: 1}},
        {new: true},
        function (err, doc) {
            if (err) throw err;
            callback(err, doc.value.sequence_value);
        }
    );
}

function updateUsers() {
    var cursor = db.collection('users').find();
    users.length = 0;

    cursor.each(function (err, doc) {
        if (doc != null) {
            users.push(doc);
        }
    });
}

function checkUser(loginUser) {
    var key = false;
    users.forEach(function (user) {
        if (user.email === loginUser.email && user.password === loginUser.password) {
            key = true;
            sess.uid = user._id;
            sess.email = user.email;
            return true;
        }
    });
    return key;
}