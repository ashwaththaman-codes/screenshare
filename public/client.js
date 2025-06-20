const socket = io("https://your-server-url.com"); // Replace with your deployed server URL

let peerConnection;
let localStream;
const video = document.getElementById("video");

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

function getRoomId() {
  return document.getElementById("room").value;
}

function startScreenShare() {
  const room = getRoomId();
  if (!room) return alert("Enter a room ID");

  socket.emit("join", room);

  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(stream => {
      localStream = stream;
      video.srcObject = stream;

      peerConnection = new RTCPeerConnection(config);
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("signal", { room, data: { candidate: event.candidate } });
        }
      };

      peerConnection.createOffer()
        .then(offer => {
          peerConnection.setLocalDescription(offer);
          socket.emit("signal", { room, data: { offer } });
        });
    });
}

function joinScreen() {
  const room = getRoomId();
  if (!room) return alert("Enter a room ID");

  socket.emit("join", room);

  peerConnection = new RTCPeerConnection(config);

  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("signal", { room, data: { candidate: event.candidate } });
    }
  };
}

socket.on("signal", async data => {
  if (data.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { room: getRoomId(), data: { answer } });
  }

  if (data.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});
