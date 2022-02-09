const express = require("express");
const path = require("path");
const app = express();
const http = require("http");
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
// load in socket.io library
const socket = require("socket.io");
const Filter = require("bad-words");
const ioServer = http.createServer(app);
const io = socket(ioServer);

// express statuc middlewares, use that for related front-end code
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("new connection established");
  socket.broadcast.emit("message", "a new user has joined the chat room");

  socket.on("send_message", (message, callback) => {
    // Dirty lanauage filter
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("bad-work is not allowed");
    }
    io.emit("message", message);
    callback();
  });

  socket.on("disconnect", () => {
    io.emit("message", "a user has left the chat room");
  });
});

ioServer.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
