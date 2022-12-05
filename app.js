require("dotenv").config();
const express = require("express");
const socketHandlers = require("./socketHandlers");
const socketIO = require("socket.io");
const path = require("path");
const app = express();
const http = require("http");
const port = process.env.PORT || 5000;

let server = http.createServer(app);
let io = socketIO(server);
//app.get("/", (req, res) => res.send("<h1>Hello World From Express</h1>"));
console.log(__dirname);
app.use(express.static(path.join(__dirname + "/public")));

// main socket routine
io.on("connection", (socket) => {
  // scenario 1 - client sends server 'join' message using room to join
  socket.on("join", (clientData) => {
    socketHandlers.handleJoin(socket, clientData);
    socketHandlers.handleGetRoomsAndUsers(io);
  });

  // scenario 2 - client disconnects from server
  socket.on("disconnect", () => {
    socketHandlers.handleDisconnect(socket);
    socketHandlers.handleGetRoomsAndUsers(io);
  });

  // scenario 3 - client starts typing
  socket.on("typing", (clientData) => {
    socketHandlers.handleTyping(socket, clientData);
  });

  // scenario 4 - client sends a message
  socket.on("message", (clientData) => {
    socketHandlers.handleMessage(io, socket, clientData);
  });

  socket.on("getDataUpdate", () => {
    socketHandlers.handleGetRoomsAndUsers(io);
  });
});
// will pass 404 to error handler
app.use((req, res, next) => {
  const error = new Error("No such route found");
  error.status = 404;
  next(error);
});

// error handler middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || "Internal Server Error",
    },
  });
});

server.listen(port, () => console.log(`starting on port ${port}`));
