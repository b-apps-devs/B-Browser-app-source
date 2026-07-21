const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  closeWindow: () => ipcRenderer.send("win:close"),
  minimizeWindow: () => ipcRenderer.send("win:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.send("win:toggle-maximize"),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  setAdblock: (enabled) => ipcRenderer.send('adblock:set', !!enabled),
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
});
