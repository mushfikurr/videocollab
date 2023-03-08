const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { download } = require("electron-dl");
const fs = require("fs");
const { dialog } = require("electron");
var mime = require("mime-types");

async function readFileNames(dir) {
  try {
    const list = await (
      await fs.promises.readdir(dir)
    ).filter(
      (fileName) =>
        path.extname(fileName) === ".mp4" || path.extname(fileName) === ".mp3"
    );
    const fileNamesAndDetails = [];
    for (let fileName of list) {
      const stat = await fs.promises.stat(path.join(dir, fileName));
      fileNamesAndDetails.push({ fileName: fileName, stat: stat });
    }
    return fileNamesAndDetails;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getAllFilesWithoutObj(dirs) {
  try {
    const files = [];
    for (let dir of dirs) {
      const file = await fs.promises.readFile(dir);
      const mimeType = mime.contentType(path.extname(path.basename(dir)));
      files.push({
        fileName: path.basename(dir),
        file,
        mimeType,
      });
    }
    return files;
  } catch (err) {
    console.log(err);
  }
}

async function getAllFiles(dirs) {
  try {
    const files = [];
    for (let dir of dirs) {
      const file = await fs.promises.readFile(path.join(dir.dir, dir.fileName));
      const mimeType = mime.contentType(
        path.extname(path.join(dir.dir, dir.fileName))
      );
      files.push({ fileName: dir.fileName, file, mimeType });
    }
    return files;
  } catch (err) {
    return [];
  }
}

async function selectDirectory(properties) {
  // ["openFile", "openDirectory"]
  return dialog
    .showOpenDialog({ properties: properties })
    .then(function (response) {
      return response;
    });
}

const activeWindow = BrowserWindow.getFocusedWindow();

async function downloadPath(urlPathObj) {
  download(BrowserWindow.getAllWindows()[0], urlPathObj.url, {
    directory: urlPathObj.path,
    filename: urlPathObj.filename,
  })
    .then((dl) => {
      return dl.getSavePath();
    })
    .catch((err) => {
      console.log(err);
    });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    show: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), "public", "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }
}

ipcMain.handle("getFilesInDirectory", async (_, directory) =>
  readFileNames(directory)
);

ipcMain.handle("getAllFilesWithoutObj", async (_, files) =>
  getAllFilesWithoutObj(files)
);

ipcMain.handle("getAllFiles", async (_, files) => getAllFiles(files));

ipcMain.handle("selectDirectory", async (_, properties) =>
  selectDirectory(properties)
);

ipcMain.handle("download", async (_, urlPathObj) => downloadPath(urlPathObj));

ipcMain.on("close", () => {
  app.quit();
});

ipcMain.on("minimise", () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on("maximise", () => {
  if (!BrowserWindow.getFocusedWindow()?.isMaximized()) {
    BrowserWindow.getFocusedWindow()?.maximize();
  } else {
    BrowserWindow.getFocusedWindow()?.unmaximize();
  }
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
