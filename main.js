const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const path = require("path");
let win;
let adblockEnabled = false;
// simple ad domains list (extend as needed)
const adDomains = [
  "doubleclick.net",
  "googlesyndication.com",
  "adservice.google.com",
  "pagead2.googlesyndication.com",
  "adsystem.com",
  "adnxs.com",
  "amazon-adsystem.com"
];

function isAdUrl(u){try{var url=new URL(u);return adDomains.some(function(d){return url.hostname.endsWith(d)||url.hostname.indexOf(d)!==-1;});}catch(e){return false;}}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 480,
    frame: false,
    backgroundColor: "#0d0e10",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false, // using iframe in app
    },
  });
  win.loadFile("index.html");
}

// register a single webRequest handler that cancels ad requests when enabled
function setupAdblock() {
  const filter = { urls: ["*://*/*"] };
  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    if (adblockEnabled && details && details.url && isAdUrl(details.url)) {
      return callback({ cancel: true });
    }
    callback({ cancel: false });
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAdblock();
  // auto-update (electron-updater)
  try{
    const { autoUpdater } = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify();
  }catch(e){
    console.warn('autoUpdater not available:', e && e.message);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("win:close", () => win && win.close());
ipcMain.on("win:minimize", () => win && win.minimize());
ipcMain.on("win:toggle-maximize", () => {
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.on("open-external", (_evt, url) => {
  if (typeof url === "string" && /^https?:\/\//i.test(url)) {
    shell.openExternal(url);
  }
});

ipcMain.on('adblock:set', (_evt, enabled) => {
  adblockEnabled = !!enabled;
});

ipcMain.on('check-for-updates', () => {
  try{
    const { autoUpdater } = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify();
  }catch(e){
    console.warn('autoUpdater not available:', e && e.message);
  }
});
