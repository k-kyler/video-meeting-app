// Import libraries and app setup
const express = require("express");
const { v4: v4UniqueId } = require("uuid");
const http = require("http");
const { ExpressPeerServer } = require("peer");
const app = express();
const port = process.env.PORT || 7000;
const httpServer = http.Server(app);
const io = require("socket.io")(httpServer);
const peerServer = ExpressPeerServer(httpServer, {
    debug: true,
});
var path = require('path');
var bodyParser = require('body-parser');
var AccountModel = require('./models/account')


app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())


app.get('/', (req, res, next) => {
    res.render('index')
})

app.get('/login', (req, res, next) => {
    res.render('login')
})

app.post('/login', (req, res, next) => {
    var username = req.body.username
    var password = req.body.password

    AccountModel.findOne({
            username: username,
            password: password
        })
        .then(data => {
            if (data) {
                res.json('Dang nhap thanh cong')
                res.render("mettingRoom")
            } else {
                res.status(400).json('Dang nhap that bai')
            }
        })
        .catch(err => {
            res.status(500).json('Loi server')
        })
        /* res.redirect(`/meetingroom/${v4UniqueId()}`); */
})

app.get("/meetingroom/:id", (req, res) => {
    res.render("meetingRoom", {
        meetingRoomId: req.params.id,
    });
});


app.get('/signup', (req, res, next) => {
    res.render('signup')
})
app.post('/signup', (req, res, next) => {
    var username = req.body.username
    var password = req.body.password

    AccountModel.findOne({
            username: username
        })
        .then(data => {
            if (data) {
                res.json('User nay da ton tai')
            } else {
                return AccountModel.create({
                    username: username,
                    password: password
                })
            }
        })
        .then(data => {
            res.json('Tao tai khoan thanh cong')
        })
        .catch(err => {
            res.status(500).json('Tao tai khoan that bai')
        })
})


// Server listen to the emitting messages from client to take on action
io.on("connection", (socket) => {
    // When server has listened to the emitting message from user,
    // it will take the user to the specific room that the user is asking to entry
    // and emit all the users of that room to know that the new user has entried
    socket.on("entry room", (meetingRoomId, userId) => {
        socket.join(meetingRoomId);
        socket
            .to(meetingRoomId)
            .broadcast.emit("new user has connected", userId);

        // Server listen to the emitting message when client input their message
        // and emit back a message to allow client rendering new message on the web page
        socket.on("new message", (newMessage) => {
            io.to(meetingRoomId).emit("add new message", newMessage);
        });
    });
});

// Entry endpoint
// When enter into this endpoint it will also generate a unique room id and redirect you to that room
app.get("/create", (req, res) => {
    res.redirect(`/meetingroom/${v4UniqueId()}`);
});

// Meeting room endpoint
app.get("/meetingroom/:id", (req, res) => {
    res.render("meetingRoom", {
        meetingRoomId: req.params.id,
    });
});

// Server listen
httpServer.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});