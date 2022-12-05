const moment = require("moment-timezone");
const matColours = require("./matdes100colours.json");
let users = [];

const handleJoin = function (socket, clientData) {
  // scenario 1 - client sends server 'join' message using room to join
  // If the name has not been taken
  if (
    !users.some(
      (user) => user.name === clientData.chatName && user.name != "Admin"
    )
  ) {
    //Join the user:
    socket.name = clientData.chatName;
    socket.roomname = clientData.roomName;
    socket.join(clientData.roomName);

    //the server returns a welcome message to the client from a generic Admin account,
    socket.emit("welcome", {
      from: "Admin",
      text: `welcome ${socket.name}`,
      colour: "#2F4F4F",
      time: moment().tz("America/New_York").format("h:mm:ss a"),
      room: socket.roomname,
    });

    //The server will then send a someonejoined message to all other clients
    //that have already joined the room in question
    socket.to(clientData.roomName).emit("someonejoined", {
      from: "Admin",
      text: `${socket.name} has joined this room`,
      colour: "#2F4F4F",
      time: moment().tz("America/New_York").format("h:mm:ss a"),
      room: socket.roomname,
    });

    //create a colour for the user:
    let coloridx = Math.floor(Math.random() * matColours.colours.length) + 1;
    let valid = false;
    let foundsame = false;
    while (!valid) {
      //Loop through users and check if we have a same colour
      users.forEach((user) => {
        if (user.colour == coloridx) {
          foundsame = true;
        }
      });

      //If we didnt find one with the same colour, move on
      if (!foundsame) valid = true;

      //If we found one with the same colour, make a new colour
      if (foundsame)
        coloridx = Math.floor(Math.random() * matColours.colours.length) + 1;
    }

    //Add the user
    users.push({
      name: clientData.chatName,
      colour: matColours.colours[coloridx],
      room: clientData.roomName,
    });
  } else {
    //The name already exists
    socket.emit("nameexists", {
      text: `'${clientData.chatName}' is already in use - try a different name`,
    });
  }
};

const handleDisconnect = function (socket) {
  //Remove socket user from the users array
  users.splice(
    users
      .map(function (user) {
        return user.name;
      })
      .indexOf(socket.name),
    1
  );

  //Tell all other users that someone left
  socket.to(socket.roomname).emit("someoneleft", {
    from: "Admin",
    text: `${socket.name} has left room ${socket.roomname}`,
    colour: "#2F4F4F",
    time: moment().tz("America/New_York").format("h:mm:ss a"),
    room: socket.roomname,
  });
};

const handleTyping = function (socket, clientData) {
  socket
    .to(socket.roomname)
    .emit("someoneistyping", { text: `${socket.name} is typing` });
};

const handleMessage = function (io, socket, clientData) {
  io.in(socket.roomname).emit("newmessage", {
    from: clientData.from,
    colour: users.find((user) => user.name == clientData.from).colour,
    text: clientData.text,
    time: moment().tz("America/New_York").format("h:mm:ss a"),
    room: socket.roomname,
  });
};

const handleGetRoomsAndUsers = function (io) {
  io.emit("roomsandusers", users);
};

module.exports = {
  handleJoin,
  handleDisconnect,
  handleTyping,
  handleMessage,
  handleGetRoomsAndUsers,
};
