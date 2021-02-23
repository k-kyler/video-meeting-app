// -------------------------- Websocket & WebRTC setup --------------------------

// Import socket.io for client
const socket = io("/");

// Setup peer for client
let peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "7000",
});

peer.on("open", (userId) => {
    // Emitting to server when user entry the room
    socket.emit("Entry room", meetingRoomId, userId);
});

// ---------------------------- Streaming video setup ----------------------------

// Add streaming video function
const addStreamingVideo = (video, stream) => {
    let colElement = document.createElement("div");

    colElement.className = "col-md-4 pt-3";
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    colElement.append(video);
    document.getElementById("videoContainer").append(colElement);
};

// ------------------- Self user --------------------

let selfStream;
let selfVideo = document.createElement("video");

selfVideo.muted = true; // Set mute to self video

// ------------------- Other user -------------------

const newUserEntried = (userId, stream) => {
    console.log(`User ${userId} has entried the room`); // remove after finish project

    let peerCall = peer.call(userId, stream);
    let otherUserVideo = document.createElement("video");

    peerCall.on("stream", (otherUserStream) => {
        addStreamingVideo(otherUserVideo, otherUserStream);
    });
};

// ----------- Self user and other user display streaming video and audio setup -----------

// Prompt a permission for asking to use their micro and camera (media input),
// it will also generate a media stream which is use to track what types of media
// are using by users such as a video track produced by camera
navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        // Self user
        selfStream = stream;
        addStreamingVideo(selfVideo, stream);

        // Other user listen to the emitting message from server and also make a call
        socket.on("New user has connected", (userId) => {
            newUserEntried(userId, stream);
        });

        // All users will answer the call to see the other user's video in the room
        peer.on("call", (call) => {
            let video = document.createElement("video");

            call.answer(stream);
            call.on("stream", (userStream) => {
                addStreamingVideo(video, userStream);
            });
        });
    });

// ------------------------- Client message type in handler -------------------------

let inputMessage = document.getElementById("inputMessage");
let buttonInputMessage = document.getElementById("buttonInputMessage");

// Get the input message when user type enter and emit to server
inputMessage.addEventListener("keydown", (event) => {
    if (inputMessage.value !== "" && event.keyCode === 13) {
        socket.emit("New message", inputMessage.value);
        inputMessage.value = "";
    }
});

// Get the input message when user click button and emit to server
buttonInputMessage.addEventListener("click", () => {
    if (inputMessage.value !== "") {
        socket.emit("New message", inputMessage.value);
        inputMessage.value = "";
    }
});

// Client listen to the emitting message from server to add new message on the web page
socket.on("Add new message", (newMessage) => {
    let messageElement = document.createElement("li");

    messageElement.innerHTML =
        `<b>${username}</b><br />` + newMessage + "<br /><br />";
    document.getElementById("chatMessages").append(messageElement);
    document.getElementById("chatBox").scrollTop = document.getElementById(
        "chatBox"
    ).scrollHeight;
});

// --------------------------------- Audio handler ---------------------------------

document.getElementById("audioButton").addEventListener("click", () => {
    // Mute audio
    if (selfStream.getAudioTracks()[0].enabled === true) {
        selfStream.getAudioTracks()[0].enabled = false;
        document.getElementById("audioIcon").classList.remove("fa-volume-up");
        document.getElementById("audioIcon").classList.add("fa-volume-mute");
    }

    // Unmute audio
    else {
        selfStream.getAudioTracks()[0].enabled = true;
        document.getElementById("audioIcon").classList.remove("fa-volume-mute");
        document.getElementById("audioIcon").classList.add("fa-volume-up");
    }
});

// --------------------------------- Video handler ---------------------------------

document.getElementById("videoButton").addEventListener("click", () => {
    // Non-display video
    if (selfStream.getVideoTracks()[0].enabled === true) {
        selfStream.getVideoTracks()[0].enabled = false;
        document.getElementById("videoIcon").classList.remove("fa-video");
        document.getElementById("videoIcon").classList.add("fa-video-slash");
    }

    // Display video
    else {
        selfStream.getVideoTracks()[0].enabled = true;
        document.getElementById("videoIcon").classList.remove("fa-video-slash");
        document.getElementById("videoIcon").classList.add("fa-video");
    }
});

// ----------------------------- Share room id handler -----------------------------

document.getElementById("shareButton").addEventListener("click", () => {
    let meetingRoomIdToShare = document.getElementById("meetingRoomIdToShare");

    meetingRoomIdToShare.select();
    meetingRoomIdToShare.setSelectionRange(0, 5000);
    document.execCommand("copy");
    document.getElementById("shareIcon").classList.remove("fa-copy");
    document.getElementById("shareIcon").classList.add("fa-check-square");
    document.getElementById("shareIcon").classList.remove("text-light");
    document.getElementById("shareIcon").classList.add("text-success");
    alert("You have just copied the room id");
});
