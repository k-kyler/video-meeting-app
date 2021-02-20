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
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator')
const path = require('path');
const session = require('express-session')
const bodyParser = require('body-parser');
const AccountModel = require('./models/account');
const { urlencoded } = require("body-parser");


app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())
app.use(session({
    secret: 'secretcat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))


app.get('/home', (req, res) => {
    if (req.session.username) {
        res.render('index')
    } else {
        res.redirect('/login')
    }
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req, res) => {
    AccountModel.findOne({
            username: req.body.username,
        })
        .then(data => {
            bcrypt.compare(req.body.password, data.password).then(function(result) {
                if (result) {
                    req.session.username = req.body.username
                    res.redirect(`/meetingroom/${v4UniqueId()}`);
                } else {
                    res.render('login', {
                        error: 'Dang nhap that bai'
                    })
                }
            })
        })
        .catch(err => {
            res.json({
                error: 'Loi server'
            })
        })
})

app.get("/meetingroom/:id", (req, res) => {
    if (req.session.username) {
        res.render("meetingRoom", {
            meetingRoomId: req.params.id,
        });
    } else {
        res.redirect('/login')
    }

});


app.get('/signup', (req, res) => {
    res.render('signup')
})
app.post('/signup', (req, res) => {
    var username = req.body.username
    var password = req.body.password
    var confirmpassword = req.body.confirmpassword
    let encryptedPassword = ''

    if (confirmpassword != password) {
        res.render('signup', {
            error: 'Confirm password does not match'
        })
    } else {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, function(err, hash) {
                encryptedPassword = hash
                AccountModel.findOne({
                        username: username
                    })
                    .then(data => {
                        /* const passwordhash = bcrypt.hash(password, 10)
                        const confirmpasswordhash = bcrypt.hash(confirmpassword, 10) */
                        if (data) {
                            res.render('signup', {
                                error: 'Người dùng đã tồn tại'
                            })
                        } else {
                            return AccountModel.create({
                                username: username,
                                password: encryptedPassword,
                            })
                        }
                    })
                    .then(data => {
                        res.render('login')
                    })
                    .catch(err => {
                        res.render('signup', {
                            error: 'Tạo tài khoản thất bại'
                        })
                    })
            })
        })

    }
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