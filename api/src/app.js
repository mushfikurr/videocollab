const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const fs = require("fs");
const path = require("path");
const actions = require("./actions");
var actionResponse = require("./ActionResponse");
var mime = require("mime-types");

const router = express.Router();
const app = express();
const server = http.createServer(app);
const multer = require("multer");
const { getVideoDurationInSeconds } = require("get-video-duration");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fluent_ffmpeg = require("fluent-ffmpeg");
fluent_ffmpeg.setFfmpegPath(ffmpegPath);

let fileIndex = 0;
const storage = multer.diskStorage({
  destination: function (req, _, cb) {
    const destPath =
      __dirname + `/uploads/${req.body.roomCode}/${req.body.username}`;
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: function (_, file, cb) {
    fileIndex++;
    let ext =
      mime.extension(file.mimetype) === "mpga"
        ? "mp3"
        : mime.extension(file.mimetype);
    console.log(ext);
    cb(null, fileIndex + "-" + file.originalname + "." + ext);
  },
});
const upload = multer({
  storage: storage,
  onFileUploadStart: function (file) {
    console.log(file.originalname + " is starting ...");
  },
  limits: { fieldSize: 100 * 1024 * 1024 },
});
var io = require("socket.io")(server);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let rooms = {};
let idToUsername = {};
let chat = {};

const isRoomAlive = (roomCode) => {
  return roomCode in rooms;
};

const isUserInRoom = (roomCode, username) => {
  return rooms[roomCode] && rooms[roomCode].includes(username);
};

const joinUserToRoom = (roomCode, username) => {
  if (!isUserInRoom(roomCode, username)) {
    rooms[roomCode] = [...rooms[roomCode], username];
    console.log("Added " + username + " to", roomCode);
    if (!chat[roomCode]) {
      chat[roomCode] = [];
    }
    console.log(rooms);
  }
};

const getRoomFromUser = (username) => {
  for (let room in rooms) {
    if (isUserInRoom(room, username)) return room;
  }
  return false;
};

const joinRoom = (roomCode, username) => {
  if (isRoomAlive(roomCode)) {
    joinUserToRoom(roomCode, username);
    return true;
  } else {
    console.log(
      "Room is not alive. Could not connect",
      username,
      "to",
      roomCode
    );
    return false;
  }
};

const removeRoomIfInactive = (roomCode) => {
  if (isRoomAlive(roomCode)) {
    if (!rooms[roomCode].length) {
      console.log(`Room ${roomCode} is inactive. Deleting...`);
      delete rooms[roomCode];
      fs.rmSync(path.join(__dirname, "uploads", roomCode), {
        recursive: true,
        force: true,
      });
    }
  }
};

const isUserHost = (roomCode, username) => {
  if (isRoomAlive(roomCode) && isUserInRoom(roomCode, username)) {
    return rooms[roomCode][0] === username;
  }
};

const getHostFromRoom = (roomCode) => {
  if (isRoomAlive(roomCode)) {
    return rooms[roomCode[0]];
  }
};

const disconnectFromRoom = (roomCode, username) => {
  if (isRoomAlive(roomCode) && isUserInRoom(roomCode, username)) {
    rooms[roomCode] = rooms[roomCode].filter((e) => e !== username);
    console.log(rooms[roomCode]);
    removeRoomIfInactive(roomCode);
    console.log("Disconnected " + username + " from " + roomCode);
    return true;
  } else {
    console.log(`Error disconnecting ${username} from ${roomCode}`);
    console.log(
      `isRoomAlive ${roomCode}, isUserInRoom ${isUserInRoom(
        roomCode,
        username
      )}`
    );
    return false;
  }
};

router.post("/upload_files", upload.array("files"), uploadFiles);

function uploadFiles(_, res) {
  fileIndex = 0;
  res.json({ message: "Successfully uploaded files" });
  console.log("File uploaded..!");
}

async function getUserFile(username, roomCode) {
  const userPath = path.join(__dirname, "uploads", roomCode, username);

  try {
    const filesFromDir = await fs.promises.readdir(userPath);
    const list = filesFromDir.filter(
      (fileName) =>
        path.extname(fileName) === ".mp4" || path.extname(fileName) === ".mp3"
    );

    const fileNames = [];
    for (let fileName of list) {
      const videoDuration = await getVideoDurationInSeconds(
        path.join(userPath, fileName)
      );
      fileNames.push({ fileName: fileName, videoDuration: videoDuration });
    }

    return fileNames;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getAllFiles(roomCode) {
  try {
    const userFiles = {};
    for (const user of rooms[roomCode]) {
      const files = await getUserFile(user, roomCode);
      userFiles[user] = files;
    }
    return userFiles;
  } catch (err) {
    console.log(err);
    return {};
  }
}

router.post("/getfiles", async (req, res) => {
  if (
    isRoomAlive(req.body.roomCode) &&
    isUserInRoom(req.body.roomCode, req.body.username)
  ) {
    console.log("Getting files...");
    getAllFiles(req.body.roomCode)
      .then((result) => {
        console.log(result);
        res.status(200).json({
          message: "Successfully retrieved files from uploads folder.",
          files: result,
        });
      })
      .catch((err) => {
        res.status(400).json({
          message: "There was an error retrieving your files.",
          err: err,
        });
      });
  } else {
    if (!isRoomAlive(req.body.roomCode)) {
      res.status(400).json({
        message: "The roomCode entered is not alive.",
      });
    } else if (!isUserInRoom(req.body.roomCode, req.body.username)) {
      res.status(400).json({
        message: "The user is not in the specified room.",
        room: rooms,
      });
    }
  }
});

router.post("/join", (req, res) => {
  if (
    isRoomAlive(req.body.roomCode) &&
    !isUserInRoom(req.body.roomCode, req.body.username)
  ) {
    res.status(200).json({ message: "Successfully joined room." });
  } else if (isUserInRoom(req.body.roomCode, req.body.username)) {
    res.status(400).json({
      message: "There is already a user in this room with your username.",
    });
  } else {
    res.status(400).json({
      message: "That room does not exist!",
    });
  }
});

router.post("/create", (req, res) => {
  if (!isRoomAlive(req.body.roomCode)) {
    rooms[req.body.roomCode] = [];
    console.log("Created room ", req.body.roomCode);
    console.log(rooms);
    res.status(200).json({ message: "Succesfully created a room" });
  } else {
    res.status(400).json({ message: "This room name already exists" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads/")));
app.use("/", router);

server.listen(process.env.PORT || 5000, () => {
  const port = process.env.PORT ? process.env.PORT : 5000;
  console.log("Started on PORT " + port);
});

io.on("connection", (socket) => {
  socket.on("join", (roomCode, username, fn) => {
    console.log("Socket (", username + " ) has connected to server.");
    if (isRoomAlive(roomCode)) {
      if (!joinRoom(roomCode, username)) {
        console.log(username + " failed to join room ", roomCode);
        socket.emit("failure", roomCode);
      } else {
        console.log(username + " has joined socket room", roomCode);
        idToUsername[socket.id] = username;
        socket.join(roomCode);
        fn("ack");
      }
    } else {
      console.log(" failed to join");
      socket.emit("failure", roomCode);
    }
  });

  socket.on("actionClient", (action) => {
    if (
      isRoomAlive(action.roomCode) &&
      isUserInRoom(action.roomCode, action.username)
    ) {
      if (action.type === "seek") {
        let response = new actionResponse.ActionResponse(
          "seek",
          action.roomCode,
          { timestamp: action.timestamp },
          true
        );
        response.sendToClient(io);
      } else if (action.type === "play") {
        let response = new actionResponse.ActionResponse(
          "play",
          action.roomCode,
          { playing: true },
          true
        );
        response.sendToClient(io);
      } else if (action.type === "pause") {
        let response = new actionResponse.ActionResponse(
          "pause",
          action.roomCode,
          { playing: false },
          true
        );
        response.sendToClient(io);
      } else if (action.type === "fileSync") {
        io.to(action.roomCode).emit("fileSync");
      } else if (action.type === "getUsers") {
        io.to(action.roomCode).emit("users", rooms[action.roomCode]);
        console.log("users", rooms[action.roomCode]);
        if (action.roomCode in chat) {
          io.to(action.roomCode).emit("chatResponse", chat[action.roomCode]);
        }
      }
    }
  });

  socket.on("chat", (roomCode, username, message) => {
    console.log("chat", message);
    chat[roomCode] = [
      ...chat[roomCode],
      { username: username, message: message },
    ];
    io.to(roomCode).emit("chatResponse", chat[roomCode]);
  });

  socket.on("action", (action, fn) => {
    if (
      isRoomAlive(action.roomCode) &&
      isUserInRoom(action.roomCode, action.username)
    ) {
      const exportPath = path.join(
        __dirname,
        "uploads",
        action.roomCode,
        "preview"
      );
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }
      const exportFile = path.join(exportPath, "currentRender.mp4");
      actions.addAction(action.roomCode, action);
      actions.processAllActions(io, action.roomCode, exportFile).then(() => {
        console.log("Completed all actions");
      });
    }
  });

  socket.on("disconnect", () => {
    const username = idToUsername[socket.id];
    const room = getRoomFromUser(username);
    if (disconnectFromRoom(room, username)) {
      socket.leave(room);
      socket.disconnect();
      console.log(rooms);
    } else {
      console.log("Failed to disconnect user [Forcibly closed conn]");
      console.log("rooms");
    }
  });
});
