const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", socket => {
  console.log("New connection");

  socket.on("join", room => {
    socket.join(room);
    console.log(`Joined room: ${room}`);
  });

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });
});

server.listen(3000, () => {
  console.log("Signaling server running on port 3000");
});
