const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  close: () => ipcRenderer.send("close"),
  minimise: () => ipcRenderer.send("minimise"),
  maximise: () => ipcRenderer.send("maximise"),
  getFilesInDirectory: (directory) =>
    ipcRenderer.invoke("getFilesInDirectory", directory),
  selectDirectory: (properties) =>
    ipcRenderer.invoke("selectDirectory", properties),
  getAllFiles: (files) => ipcRenderer.invoke("getAllFiles", files),
  getAllFilesWithoutObj: (files) =>
    ipcRenderer.invoke("getAllFilesWithoutObj", files),
  downloadFile: (urlPathObj) => ipcRenderer.invoke("download", urlPathObj),
});
