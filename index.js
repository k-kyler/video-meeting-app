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

app.set("view engine", "pug");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

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
