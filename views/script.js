// implement is the camera and video access, and stream it to the local-video element. To do it, you need to open
var isAlreadyCalling = false;
var socket = io().connect('localhost:3003');
const { RTCPeerConnection, RTCSessionDescription } = window;
// RTCPeerConnection: stream audio and video between users.
var peerConnection = new RTCPeerConnection()

// property "ontrack" is an EventHandler which specifies a function to be called when the track event occurs, indicating that a track has been added to the RTCPeerConnection.
peerConnection.ontrack = function({ streams: [stream] }) {
  const remoteVideo = document.getElementById("stream_video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia(
    {  video: true, // we want video track
      audio: true // we want audio track
    },
    stream => {
      const localVideo = document.getElementById("myself_video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    },
    error => {
      console.warn(error.message);
    }
);


socket.on('update_user_list', (data) => {
  const activeUserContainer = document.getElementById("active-user-container");
  data.users.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerElement = createUserItemContainer(socketId);
      activeUserContainer.appendChild(userContainerElement);
    }
  });
})


socket.on('remove_user', ({ socketId }) => {
    const elementToRemove = document.getElementById(socketId);  
    if (elementToRemove) {
      elementToRemove.remove();
    }
});

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");
  
  const usernameEl = document.createElement("p");
  
  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;
  
  userContainerEl.appendChild(usernameEl);
  
  userContainerEl.addEventListener("click", () => {
      // unselectUsersFromList();
      userContainerEl.setAttribute("class", "active-user active-user--selected");
      const talkingWithInfo = document.getElementById("talking-with-info");
      talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
      callUser(socketId);
    });
    return userContainerEl;
}

async function callUser(socketId) {
  // createOffer() :  initiates the creation of an SDP offer for the purpose of starting a new WebRTC connection to a remote peer.
  // What is SDP? -> The Session Description Protocol (SDP) is a format for describing multimedia communication sessions for the purposes of session announcement and session invitation.
  // Offer/Answer model
  const offer = await peerConnection.createOffer();

  // What "RTCSessionDescription" deals with? -> RTCSessionDescription interface describes one end of a connection—or potential connection—and how it's configured. Each RTCSessionDescription consists of a description type indicating which part of the offer/answer negotiation process it describes and of the SDP descriptor of the session.

  // (Continue from last paragraph)The process of negotiating a connection between two peers involves exchanging RTCSessionDescription objects back and forth, with each description suggesting one combination of connection configuration options that the sender of the description supports. Once the two peers agree upon a configuration for the connection, negotiation is complete.
  // What's "setLocalDescription" for? -> The RTCPeerConnection method "setLocalDescription()" changes the local description associated with the connection. This description specifies the properties of the local end of the connection, including the media format.
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
  
  // In high-level: line 78 and line 83 allows peers to exchange local and remote audio and media information, such as resolution. Signaling to exchange media configuration information proceeds by exchanging an offer and an answer using the Session Description Protocol (SDP). (Explanation reference: https://www.html5rocks.com/en/tutorials/webrtc/basics/)

  socket.emit("call_user", {
    offer,
    to: socketId
  });
}

socket.on("call_made", async data => {

  // Exchange media config info with the peer who starts the call
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  // "createAnswer()" method on the RTCPeerConnection interface creates an SDP answer to an offer received from a remote peer during the offer/answer negotiation of a WebRTC connection. 
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
  
  socket.emit("make_answer", {
    answer,
    to: data.socket
  });
});

 socket.on("answer_made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
  
  if (!isAlreadyCalling) {
    callUser(data.socket);
    isAlreadyCalling = true;
  }
});