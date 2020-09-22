Quick start
  - git clone git@github.com:kelvin94/Vidcall.git
  - cd Vidcall
  - docker build -t kelvinkkl/vidcall .
  - docker run --name vidcall -p {anyLocalPorts}:3003 kelvinkkl/vidcall

Features:
  - privat 1-on-1 video chat

Frameworks and libraries involved:

  -Express: Using express for routing requests, static files rendering
  -Socketio: establish tcp connection with multiple devices through websockets
  -WebRTC: allow media devices(mics and camera) to be streamed between connected nodes(devices)

TODOs: 
  1. changed to room based video calls for allowing a person hosting multiple chats 
  2. Stub an image into other users' frame when other users disconnects from the call
  3. Build features mentioned in Zipcalls(see https://github.com/ianramzy/decentralized-video-chat)
