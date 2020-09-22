const express = require('express')
const path = require('path')
const app = express();
const socket = require("socket.io");
const morgan = require( 'morgan');
const DEFAULT_PORT = 3003
// Reference repo: https://github.com/kyle8998/Vynchronize/blob/master/server.js

/*****
 * Reference article:
 * - https://tsh.io/blog/how-to-write-video-chat-app-using-webrtc-and-nodejs/
 */


// For http request logging
app.use(morgan('dev'));

// Middleware, things that gets executed when a requests going through the routes matching
app.use('/', (req, res, next) => {
    next()
})
// tell express, which static files you want to serve
app.use(express.static(__dirname + '/views'));

const server = app.listen(DEFAULT_PORT, () => {
    console.log('now listeng port '+DEFAULT_PORT)
});

// io is a Socket.IO server instance attached to an instance of http.Server listening for incoming events.
const io = socket(server)

var runningSockets = []

// connection event
// "socket" argument, what is it? -> The socket argument of the connection event listener callback function is an object that represents an incoming socket connection from a client.

/**
 * All events:
 *      - update_user_list
 *      - remove_user
 *      - call_user
 */
io.on('connection', (socket) => {
    console.log('a user is connected',socket.id)
    // check if a socket already created and still being used
    let existingSockets = runningSockets.find(
        s => s == socket.id
    )
    
    if(!existingSockets) {

        runningSockets.push(socket.id)
        
        // send all existing sockets info back to client but not the socket info of myself
        socket.emit('update_user_list', {
            users : runningSockets.filter(
                // don't update the current socket itself
                existingSocket => existingSocket !== socket.id
            )
        })
        
        // let everybody elses know I am a newly joined user
        socket.broadcast.emit('update_user_list', {
            users : [socket.id]
        })
    }

    // Relay calls to the user who should pick up the call
    socket.on('call_user', (data) => {
        socket.to(data.to).emit('call_made', {
            offer: data.offer,
            socket: socket.id
        })
    })

    // Relay answer
    socket.on("make_answer", data => {
        socket.to(data.to).emit("answer_made", {
          socket: socket.id,
          answer: data.answer
        });
      });

      socket.on('disconnect', () => {
        runningSockets = runningSockets.filter(
            existingSocket => existingSocket !== socket.id
        )
        socket.broadcast.emit('remove_user', {
          socketId : socket.id            
        })
    });
})

// router
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, './views/main.html'))  
});
