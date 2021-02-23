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
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const AccountModel = require("./models/account");
const SESSION_NAME = "webrtc";
const mongoose = require("mongoose");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use("/peerjs", peerServer);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
    session({
        name: SESSION_NAME,
        secret: "secretcat",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 },
    })
);

mongoose.connect(
    "mongodb+srv://webrtc-user_005:adminwebrtc123456@cluster0.kopin.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    }
);

// Custom middleware to check if user not login
const checkLogin = (req, res, next) => {
    if (!req.session.username) {
        res.redirect("/login");
    } else {
        next();
    }
};

// Custom middleware to prevent user from accessing routes that don't need after logged in
const preventWhenLogged = (req, res, next) => {
    if (req.session.username) {
        res.redirect("/");
    } else {
        next();
    }
};

// Index endpoint
app.get("/", (req, res) => {
    if (req.session.username) {
        res.render("index", {
            username: req.session.username,
        });
    } else {
        res.render("index");
    }
});

// User log in endpoint
app.get("/login", preventWhenLogged, (req, res) => {
    res.render("login");
});

app.post("/login", preventWhenLogged, (req, res) => {
    AccountModel.findOne({
        username: req.body.username,
    })
        .then((data) => {
            bcrypt
                .compare(req.body.password, data.password)
                .then(function (result) {
                    if (result) {
                        req.session.username = req.body.username;
                        res.redirect("/");
                    } else {
                        res.render("login", {
                            error: "Invalid email or password",
                        });
                    }
                });
        })
        .catch((err) => {
            res.render("login", {
                error: "Invalid email or password",
            });
        });
});

// User sign up endpoint
app.get("/signup", preventWhenLogged, (req, res) => {
    res.render("signup");
});

app.post("/signup", preventWhenLogged, (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var confirmpassword = req.body.confirmpassword;
    let encryptedPassword = "";

    if (confirmpassword != password) {
        res.render("signup", {
            error: "Confirm password does not match",
        });
    } else {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, function (err, hash) {
                encryptedPassword = hash;
                AccountModel.findOne({
                    username: username,
                })
                    .then((data) => {
                        /* const passwordhash = bcrypt.hash(password, 10)
                        const confirmpasswordhash = bcrypt.hash(confirmpassword, 10) */
                        if (data) {
                            res.render("signup", {
                                error: "User has already existed",
                            });
                        } else {
                            AccountModel.create({
                                username: username,
                                password: encryptedPassword,
                            });
                            res.redirect("/login");
                        }
                    })
                    .catch((err) => {
                        res.render("signup", {
                            error: "User has already existed",
                        });
                    });
            });
        });
    }
});

// User logout endpoint
app.get("/logout", checkLogin, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            res.redirect("/");
        } else {
            res.clearCookie(SESSION_NAME);
            res.redirect("/");
        }
    });
});

// Join by room id or create room endpoint
app.get("/roomoption", checkLogin, (req, res) => {
    res.render("roomOption");
});

// Join room by id endpoint
app.post("/join", checkLogin, (req, res) => {
    res.redirect(`/meetingroom/${req.body.joinRoomId}`);
});

// Create room endpoint
app.get("/create", checkLogin, (req, res) => {
    res.redirect(`/meetingroom/${v4UniqueId()}`);
});

// Meeting room endpoint
app.get("/meetingroom/:id", checkLogin, (req, res) => {
    res.render("meetingRoom", {
        meetingRoomId: req.params.id,
        username: req.session.username,
    });
});

// Server listen to the emitting messages from client to take on action
io.on("connection", (socket) => {
    // When server has listened to the emitting message from user,
    // it will take the user to the specific room that the user is asking to entry
    // and emit all the users of that room to know that the new user has entried
    socket.on("Entry room", (meetingRoomId, userId) => {
        socket.join(meetingRoomId);
        socket
            .to(meetingRoomId)
            .broadcast.emit("New user has connected", userId);

        // Server listen to the emitting message when client input their message
        // and emit back a message to allow client rendering new message on the web page
        socket.on("New message", (newMessage) => {
            io.to(meetingRoomId).emit("Add new message", newMessage);
        });
    });
});

// Server listen
httpServer.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
