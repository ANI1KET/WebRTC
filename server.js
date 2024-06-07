import express from "express";
import { Server } from "socket.io";

import userRoute from './routes/userRoute.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));
app.use('/', userRoute);

const server = app.listen(5000, () => {
    console.log(`Server Running on Port : 5000`);
});

const io = new Server(server,
    // {
    //     cors: {
    //         origin: "*",
    //         methods: ["GET", "POST"],
    //     },
    // }
);

io.on('connection', (socket) => {
    console.log("User connected with id :", socket.id);

    socket.on("join", (roomName) => {
        var rooms = io.sockets.adapter.rooms;

        const room = rooms.get(roomName);

        if (room == undefined) {
            socket.join(roomName);
            socket.emit("created");
        }
        else if (room.size == 1) {
            socket.join(roomName);
            socket.emit("joined");
        }
        else {
            socket.emit("full");
        }
    })

    socket.on("ready", (roomName) => {
        console.log("Ready");
        socket.broadcast.to(roomName).emit("ready");
    });

    socket.on("candidate", (candidate, roomName) => {
        console.log("Candidate ");
        socket.broadcast.to(roomName).emit("candidate", candidate);
    });

    socket.on("offer", (offer, roomName) => {
        console.log("Offer ");
        socket.broadcast.to(roomName).emit("offer", offer);
    });

    socket.on("answer", (answer, roomName) => {
        console.log("Answer");
        socket.broadcast.to(roomName).emit("answer", answer);
    });

    socket.on("leave", (roomName) => {
        console.log("leave");
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit("leave");
    });
});