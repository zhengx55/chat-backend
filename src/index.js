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
const { generateMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/user");

// express statuc middlewares, use that for related front-end code
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("new connection established");
  // listener for join room
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username: username,
      room: room,
    });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(
          `${user.username} has joined the chat room`,
          user.username
        )
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("send_message", (message, callback) => {
    const user = getUser(socket.id);
    if (user) {
      const filter = new Filter(); // Dirty lanauage filter

      if (filter.isProfane(message)) {
        return callback("bad-work is not allowed");
      }
      io.to(user.room).emit("message", generateMessage(message, user.username));
      callback();
    } else {
      return callback("connection lost");
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} left the chat room`, user.username)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

ioServer.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
