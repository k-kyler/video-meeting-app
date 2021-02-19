// ----------------
// IMPORT LIBRARIES
// ----------------
const express = require("express");
const { v4: v4 } = require("uuid");
const http = require("http");
const { ExpressPeerServer } = require("peer");

const app = express();
const port = process.env.PORT || 7000;
const httpServer = http.Server(app);
const io = require("socket.io")(httpServer);
const peerServer = ExpressPeerServer(httpServer, {
    debug: true,
});
app.set("view engine", "pug");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

// ------
// SOCKET
// ------
// Server wait for the emitting action from client to on action
io.on("connection", (socket) => {
    // When server has listened to the emitting message from user,
    // it will take the user to the specific room that the user is asking to entry
    // and emit all the users of that room to know that the new user has entried
    socket.on("entry room", (meetingRoomId, userId) => {
        socket.join(meetingRoomId);
        socket
            .to(meetingRoomId)
            .broadcast.emit("New user has connected", userId);
        // Server listen to the emitting message when client input their message
        // and emit back a message to allow client rendering new message on the web page
        socket.on("new message", (newMessage) => {
            io.to(meetingRoomId).emit("add new message", newMessage);
        });
    });
});


// ----
// INIT
// ----

// HOME
app.get("/", (req, res) => {
    res.render("index");
});

// FORMS
app.get("/signup", (req, res) => {
    res.render("signup");
});
app.get("/login", (req, res) => {
    res.render("login");
});


// ---------
// FUNCTIONS
// ---------
app.post("/signup", (req, res) => {
    // ------------------
    // HANDLE SIGNUP HERE
    // ------------------

    // IF SIGNUP SUCCESS:
    //    --> res.redirect(`/`);
    res.redirect(`/`);
    // ------------------
    // END HANDLE SIGNUP
    // ------------------
});
app.post("/login", (req, res) => {
    // ------------------
    // HANDLE LOGIN HERE
    // ------------------

    // CHECK USER FROM DATABASE: 
    //    IF USER VALID:
    //        --> res.redirect(`/meetingroom/${v4()}`);
    res.redirect(`/meetingroom/${v4()}`);
    // ------------------
    // END HANDLE LOGIN
    // ------------------
});
// UNIQUE ROOM
app.get("/meetingroom/:id", (req, res) => {
    res.render("meetingRoom", {
        meetingRoomId: req.params.id,
    });
});


// LISTEN
httpServer.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
