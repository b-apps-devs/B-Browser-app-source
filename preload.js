const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  closeWindow: () => ipcRenderer.send("win:close"),
  minimizeWindow: () => ipcRenderer.send("win:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.send("win:toggle-maximize"),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  
  // Cookie management
  getCookies: (url) => ipcRenderer.invoke("get-cookies", url),
  setCookie: (cookie) => ipcRenderer.invoke("set-cookie", cookie),
  clearCookies: () => ipcRenderer.invoke("clear-cookies"),
  
  // Storage management
  getStorageInfo: () => ipcRenderer.invoke("get-storage-info"),
});
