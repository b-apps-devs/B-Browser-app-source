const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 480,
    frame: false,               // custom titlebar in index.html acts as the real window frame
    backgroundColor: "#0d0e10",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---- Window control IPC (wired to the custom titlebar's traffic lights) ----
ipcMain.on("win:close", () => win && win.close());
ipcMain.on("win:minimize", () => win && win.minimize());
ipcMain.on("win:toggle-maximize", () => {
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

// open a URL in the user's real default browser (used by the "Open directly" fallback)
ipcMain.on("open-external", (_evt, url) => {
  if (typeof url === "string" && /^https?:\/\//i.test(url)) {
    shell.openExternal(url);
  }
});
