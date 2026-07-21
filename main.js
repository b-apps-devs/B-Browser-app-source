const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
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
      sandbox: false,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  // ---- Enable cookies and session persistence ----
  const ses = win.webContents.session;
  
  // Enable persistent storage
  ses.setStorageQuota(100 * 1024 * 1024); // 100MB quota for storage
  
  // Cookies are automatically persisted by Electron in the user data directory
  // but we ensure persistence is enabled
  win.webContents.session.cookies.on('changed', (event, cookie, cause, removed) => {
    // Cookies are automatically saved by Electron
  });

  // Allow all cross-origin requests (for web content access)
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    if (headers) {
      // Allow CORS for iframe content
      headers['Access-Control-Allow-Origin'] = ['*'];
      headers['Access-Control-Allow-Methods'] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
      headers['Access-Control-Allow-Headers'] = ['Content-Type', 'Authorization'];
    }
    callback({ responseHeaders: headers });
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

// ---- Open a URL in the user's real default browser (used by the "Open directly" fallback) ----
ipcMain.on("open-external", (_evt, url) => {
  if (typeof url === "string" && /^https?:\/\//i.test(url)) {
    shell.openExternal(url);
  }
});

// ---- Cookie management ----
ipcMain.handle("get-cookies", async (event, url) => {
  try {
    const cookies = await win.webContents.session.cookies.get({ url });
    return cookies;
  } catch (error) {
    console.error("Error getting cookies:", error);
    return [];
  }
});

ipcMain.handle("set-cookie", async (event, cookie) => {
  try {
    await win.webContents.session.cookies.set(cookie);
    return { success: true };
  } catch (error) {
    console.error("Error setting cookie:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("clear-cookies", async (event) => {
  try {
    await win.webContents.session.clearStorageData({
      storages: ['cookies']
    });
    return { success: true };
  } catch (error) {
    console.error("Error clearing cookies:", error);
    return { success: false, error: error.message };
  }
});

// ---- Storage and cache management ----
ipcMain.handle("get-storage-info", async (event) => {
  try {
    const info = await win.webContents.session.getStorageQuota();
    return info;
  } catch (error) {
    console.error("Error getting storage info:", error);
    return null;
  }
});
