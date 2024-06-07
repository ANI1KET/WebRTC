var socket = io();

var videoChatForm = document.getElementById('video-chat-form');
var videoChatRooms = document.getElementById('video-chat-rooms');

var joinBtn = document.getElementById('join');
var roomName = document.getElementById('roomname');
var userVideo = document.getElementById('user-video');
var peerVideo = document.getElementById('peer-video');

var divBtnGroup = document.getElementById('btn-group');
var muteButton = document.getElementById('muteButton');
var hideCameraButton = document.getElementById('hideCamera');
var leaveButton = document.getElementById('leaveButton');

var muteFlag = false;
var hideCameraFlag = false;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var creator = false;
var iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
    ]
}
var rtcPeerConnection;
var userStream;

joinBtn.addEventListener("click", function () {
    if (roomName.value == "") {
        alert('Please enter a room name!');
    }
    else {
        socket.emit("join", roomName.value);
    }
});
muteButton.addEventListener("click", function () {
    muteFlag = !muteFlag;
    if (muteFlag) {
        muteButton.textContent = "Unmute";
        userStream.getTracks()[0].enabled = false;
    } else {
        muteButton.textContent = "Mute";
        userStream.getTracks()[0].enabled = true;
    }
});
hideCameraButton.addEventListener("click", function () {
    hideCameraFlag = !hideCameraFlag;
    if (hideCameraFlag) {
        hideCameraButton.textContent = "Show Camera";
        userStream.getTracks()[1].enabled = false;
    } else {
        hideCameraButton.textContent = "Hide Camera";
        userStream.getTracks()[1].enabled = true;
    }
});

socket.on("created", () => {
    creator = true;
    navigator.getUserMedia(
        {
            audio: true, video: { width: 500, height: 500 }
        }, function (stream) {
            userStream = stream;
            videoChatForm.style = "display:none";
            divBtnGroup.style = "display:flex";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            }
        }, function (error) {
            alert("Error!");
        }
    );
});
socket.on("joined", () => {
    creator = false;
    navigator.getUserMedia(
        {
            audio: true, video: { width: 500, height: 500 }
        }, function (stream) {
            userStream = stream;
            videoChatForm.style = "display:none";
            divBtnGroup.style = "display:flex";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            }

            socket.emit('ready', roomName.value);
        }, function (error) {
            alert("Error!");
        }
    );
});
socket.on("full", () => {
    alert("Room is Full!");
});

socket.on("ready", () => {
    if (creator == true) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onTrack;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer()
            .then((offer) => {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer, roomName.value);
            })
            .catch(error => { console.log(error); })
    }
});
socket.on("candidate", (candidate) => {
    var iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
});
socket.on("offer", (offer) => {
    if (!creator == true) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onTrack;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer()
            .then((answer) => {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", answer, roomName.value);
            })
            .catch(error => { console.log(error); })
    }
});
socket.on("answer", (answer) => {
    rtcPeerConnection.setRemoteDescription(answer);
});

leaveButton.addEventListener("click", function () {
    socket.emit("leave", roomName.value);

    videoChatForm.style = "display:block";
    divBtnGroup.style = "display:none";

    if (userVideo.srcObject) {
        userVideo.srcObject.getTracks()[0].stop();
        userVideo.srcObject.getTracks()[1].stop();
    }

    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
    }

    if (rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    }
});

socket.on("leave", () => {
    creator = true;

    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
    }

    if (rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    }
});

var onIceCandidate = (event) => {
    if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName.value);
    }
}
var onTrack = (event) => {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function (e) {
        peerVideo.play();
    }
}