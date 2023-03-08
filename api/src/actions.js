var actionResponse = require("./ActionResponse");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fluent_ffmpeg = require("fluent-ffmpeg");
var mime = require("mime-types");
var hash = require("object-hash");

fluent_ffmpeg.setFfmpegPath(ffmpegPath);

const fs = require("fs");
const path = require("path");
const { resolve } = require("path");
var actionList = {};
var processing = [];
var timelineClips = {};

const checkPath = async (exportPath) => {
  if (!fs.existsSync(exportPath)) {
    return fs.promises.mkdir(exportPath, { recursive: true });
  }
};

const isFileExtAudio = (fileName) => {
  return mime.contentType(path.extname(fileName)).startsWith("audio");
};

// https://stackoverflow.com/questions/1997661/unique-object-identifier-in-javascript
const id = (() => {
  let currentId = 0;
  const map = new WeakMap();

  return (object) => {
    if (!map.has(object)) {
      map.set(object, ++currentId);
    }

    return map.get(object);
  };
})();

const addToTimelineClips = (roomCode, clip) => {
  if (!(roomCode in timelineClips)) {
    timelineClips[roomCode] = { video: [], audio: [] };
  }
  let keyToPush = isFileExtAudio(clip.file.fileName) ? "audio" : "video";
  const objToPush = { ...clip };
  const objId = id(objToPush);
  const o_hash = hash(objToPush);
  timelineClips[roomCode][keyToPush].push({
    ...objToPush,
    id: objId,
    hash: o_hash,
  });
};

/*

Sample resizeObj:
{id: ..., timelineKey: ..., startTime: ..., endTime: ...}

Clip after resize
{username, id, resized: {startTime, endTime}, file}

This function will update the given index (the clip we are targetting) with a resized attribute, denoting that the
clip has been resized.
*/
const resizeClip = (roomCode, resizeObj) => {
  const clipToResizeInd = timelineClips[roomCode][
    resizeObj.timelineKey
  ].findIndex((obj) => obj.hash === resizeObj.hash);
  console.log("resize obj", resizeObj);
  console.log("resize index found: ", clipToResizeInd);
  let clipToResize =
    timelineClips[roomCode][resizeObj.timelineKey][clipToResizeInd];
  console.log("resize found: ", clipToResizeInd);
  if (clipToResize) {
    clipToResize = {
      ...clipToResize,
      resized: {
        startTime: resizeObj.startTime,
        endTime: resizeObj.endTime,
        newWidth: resizeObj.newWidth,
      },
    };
    timelineClips[roomCode][resizeObj.timelineKey].splice(
      clipToResizeInd,
      1,
      clipToResize
    );
  }
};

const reorderTimelineClips = (roomCode, timelineObj) => {
  if (!(roomCode in timelineClips)) {
    timelineClips[roomCode] = { video: [], audio: [] };
  }
  timelineClips[roomCode][timelineObj.key] = timelineObj.clips;
};

const removeFromTimelineClips = (roomCode, data) => {
  if (!(roomCode in timelineClips)) {
    return new Error("That roomCode does not exist!");
  }
  const indToBeRemoved = data.index;
  let keyToAmend = isFileExtAudio(data.clip.fileName) ? "audio" : "video";
  if (indToBeRemoved <= timelineClips[roomCode][keyToAmend].length - 1) {
    timelineClips[roomCode][keyToAmend] = timelineClips[roomCode][
      keyToAmend
    ].filter((_, index) => index != indToBeRemoved);
  } else {
    console.log("Index doesnt exist!");
  }
};

const tryToExecuteAction = (io, roomCode) => {
  if (!processing.includes(roomCode)) {
    processing.push(roomCode);
    io.to(roomCode).emit("processing", "true");
    return true;
  }
  return false;
};

const removeRoomFromProcessingLock = (io, roomCode) => {
  if (processing.includes(roomCode)) {
    processing = processing.filter((room) => room !== roomCode);
    io.to(roomCode).emit("processing", "false");
    console.log("Processing now false");
    return true;
  }
  return false;
};

const writeMergeTextFile = async (
  roomCode,
  timelineKey,
  pathToMergeTxtFile
) => {
  let data = "";
  for (const videoObj of timelineClips[roomCode][timelineKey]) {
    let pathToUserFile = path.resolve(
      __dirname,
      "uploads",
      roomCode,
      videoObj.username,
      videoObj.file.fileName
    );
    const resizedPath = await resize(videoObj, roomCode, pathToUserFile);

    if (resizedPath == null) {
      data = data + "file '" + pathToUserFile + "'\n";
    } else {
      console.log("resized added to merge path");
      data = data + "file '" + resizedPath + "'\n";
    }
  }

  return fs.promises
    .writeFile(pathToMergeTxtFile, data)
    .then(() => {
      return resolve(pathToMergeTxtFile);
    })
    .catch(() => {
      return reject(new Error("Error writing file."));
    });
};

const initActionList = (roomCode) => {
  if (!(roomCode in actionList)) {
    actionList[roomCode] = [];
  }
};

const renderComplete = (io, roomCode) => {
  io.to(roomCode).emit("renderComplete");
  console.log("renderComplete sent to client");
};

async function copy(roomCode, exportPath) {
  let filePath = path.join(
    __dirname,
    "uploads",
    roomCode,
    timelineClips[roomCode]["video"][0].username,
    timelineClips[roomCode]["video"][0].file.fileName
  );
  return fs.promises
    .copyFile(filePath, exportPath)
    .then(() => {
      return resolve("success");
    })
    .catch((err) => {
      console.log("Error merging (one file) in " + roomCode);
      console.log(err.message);
      return reject();
    });
}

// https://stackoverflow.com/questions/26580509/calculate-time-difference-between-two-date-in-hhmmss-javascript
function hmsToSeconds(s) {
  var b = s.split(":");
  return b[0] * 3600 + b[1] * 60 + (+b[2] || 0);
}

function resizeSync(
  pathToUserFile,
  tempExportPath,
  startTime,
  endTime,
  basefolder
) {
  console.log("\n");
  console.log("Resizing...");
  const duration = hmsToSeconds(endTime) - hmsToSeconds(startTime);
  console.log("duration", duration);
  return new Promise((resolve, reject) => {
    fluent_ffmpeg(pathToUserFile)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions(["-c:v copy", "-c:a copy"])
      .outputFormat("mp4")
      .on("end", () => {
        console.log("resize complete\n");
        return resolve(tempExportPath);
      })
      .on("error", (err, stdout, stderr) => {
        console.log("Error merging: " + err.message);
        console.log(stdout);
        console.log(stderr);
        return reject("failed");
      })
      .save(path.join(tempExportPath));
  });
}

async function resize(videoObj, roomCode, pathToUserFile) {
  if ("resized" in videoObj) {
    console.log("resize detected");
    const basename = path.basename(videoObj.file.fileName).split(".")[0];
    // Create a temp folder to store the trimmed video in.
    const basefolder = path.join(
      __dirname,
      "uploads",
      roomCode,
      videoObj.username,
      basename
    );
    checkPath(basefolder);
    const tempExportPath = path.resolve(
      __dirname,
      "uploads",
      roomCode,
      videoObj.username,
      basename,
      videoObj.file.fileName
    );
    const startTime = videoObj.resized.startTime;
    const endTime = videoObj.resized.endTime;
    return resizeSync(
      pathToUserFile,
      tempExportPath,
      startTime,
      endTime,
      basefolder
    );
  }
}

function mergeSync() {}

const ffmpegMerge = (resPath, exportPath) => {
  return new Promise((resolve, reject) => {
    fluent_ffmpeg(resPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .outputFormat("mp4")
      .on("end", () => {
        try {
          return resolve();
        } catch (err) {
          console.error(`Error while deleting ${dir}.`);
          return reject();
        }
      })
      .on("error", (err, stdout, stderr) => {
        console.log("Error merging: " + err.message);
        console.log(stdout);
        console.log(stderr);
        return reject();
      })
      .save(path.join(exportPath));
  });
};

async function merge(io, roomCode, exportPath) {
  // videoObj: {username: "Andrew", file: {fileName: "1-1G.mp4", videoDuration: 18.019ms}}
  // action: {username, roomCode, data}
  if (timelineClips[roomCode]["video"].length === 1) {
    return copy(roomCode, exportPath);
  }

  await checkPath(exportPath);

  let pathToMergeTxtFile = path.join(
    __dirname,
    "uploads",
    roomCode,
    "list.txt"
  );
  return writeMergeTextFile(roomCode, "video", pathToMergeTxtFile).then(
    (resPath) => {
      return ffmpegMerge(resPath, exportPath);
    }
  );
}

function mergeAudioAndEncodeSync(exportPath, pathToAudioFile, newExpPath) {
  return new Promise((resolve, reject) => {
    fluent_ffmpeg()
      .addInput(exportPath)
      .addInput(pathToAudioFile)
      .addOptions([
        "-filter_complex [0:a][1:a]amerge=inputs=2[a]",
        "-map 0:v",
        "-map [a]",
        "-shortest",
        "-ac 2",
        "-c:v copy",
        "-f mp4",
      ])
      .on("end", async () => {
        fs.copyFileSync(newExpPath, exportPath);
        console.log("Completed overwrite.");
        return resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.log("Error merging: " + err.message);
        console.log(stdout);
        console.log(stderr);
        return reject();
      })
      .save(path.join(newExpPath));
  });
}

async function mergeAudios(roomCode, exportPath) {
  const mergedAudioPath = path.join(__dirname, "uploads", roomCode, "audio");
  await checkPath(exportPath);

  let pathToMergeTxtFile = path.join(
    __dirname,
    "uploads",
    roomCode,
    "list-audio.txt"
  );
  return writeMergeTextFile(roomCode, "audio", pathToMergeTxtFile).then(
    (resPath) => {
      return ffmpegMerge(resPath, mergedAudioPath);
    }
  );
}

async function mergeAudio(io, roomCode, exportPath) {
  const lenTimelineClips = timelineClips[roomCode]["audio"].length;
  const newExpPath = path.join(
    path.dirname(exportPath),
    path.basename(exportPath).split(".")[0] + "-audio.mp4"
  );
  if (lenTimelineClips === 0) resolve();
  if (lenTimelineClips === 1) {
    const pathToAudioFile = path.join(
      __dirname,
      "uploads",
      roomCode,
      timelineClips[roomCode]["audio"][0].username,
      timelineClips[roomCode]["audio"][0].file.fileName
    );
    return mergeAudioAndEncodeSync(exportPath, pathToAudioFile, newExpPath);
  } else if (lenTimelineClips.length > 1) {
    const mergedAudioPath = path.join(__dirname, "uploads", roomCode, "audio");
    mergeAudios(roomCode, newExpPath);
    return mergeAudioAndEncodeSync(exportPath, mergedAudioPath, newExpPath);
  }
}

const sendTimelineClips = (io, roomCode, files) => {
  const response = new actionResponse.ActionResponse(
    "addVideoToTimeline",
    roomCode,
    { files: files }
  );
  response.sendToClient(io);
  removeRoomFromProcessingLock(io, roomCode);
};

module.exports = {
  processAllActions: async function (io, roomCode, exportPath) {
    const allActions = {
      addVideoToTimeline: addToTimelineClips,
      removeVideoFromTimeline: removeFromTimelineClips,
      reorderTimelineClips: reorderTimelineClips,
      resizeClip: resizeClip,
    };
    if (tryToExecuteAction(io, roomCode) === true) {
      timelineClips[roomCode] = {};
      timelineClips[roomCode]["video"] = [];
      timelineClips[roomCode]["audio"] = [];
      for (let action of actionList[roomCode]) {
        allActions[action.type](roomCode, action.data);
      }
      if (timelineClips[roomCode]["video"].length === 0) {
        sendTimelineClips(io, roomCode, timelineClips[roomCode]);
        return resolve();
      }
      merge(io, roomCode, exportPath).then(() => {
        console.log("merge video complete.");
        mergeAudio(io, roomCode, exportPath).then(() => {
          console.log("merge audio complete.");
          sendTimelineClips(io, roomCode, timelineClips[roomCode]);
          io.to(roomCode).emit("renderComplete");
          return resolve("success");
        });
      });
    }
  },
  addAction: function (roomCode, action) {
    initActionList(roomCode);
    actionList[roomCode].push(action);
    console.log(action.type, "action added");
    return actionList.length - 1;
  },
  removeAction: function (roomCode, index) {
    actionList.remove(actionList[roomCode][index]);
  },
};
