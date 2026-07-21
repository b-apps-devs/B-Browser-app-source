const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

let win;

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
            sandbox: false,
            webSecurity: true
        }
    });

    const ses = win.webContents.session;

    // Enable CORS (optional)
    ses.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Access-Control-Allow-Origin": ["*"],
                "Access-Control-Allow-Methods": ["GET, POST, PUT, DELETE, OPTIONS"],
                "Access-Control-Allow-Headers": ["*"]
            }
        });
    });

    // Load app
    win.loadFile(path.join(__dirname, "index.html"))
        .then(() => {
            console.log("B-Browser loaded successfully.");
        })
        .catch(err => {
            console.error("Cannot load index.html");
            console.error(err);
        });

    // Debug (xóa dòng này khi release)
    win.webContents.openDevTools();

    win.on("closed", () => {
        win = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.on("win:close", () => {
    if (win) win.close();
});

ipcMain.on("win:minimize", () => {
    if (win) win.minimize();
});

ipcMain.on("win:toggle-maximize", () => {
    if (!win) return;

    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on("open-external", (event, url) => {
    if (typeof url === "string" && /^https?:\/\//i.test(url)) {
        shell.openExternal(url);
    }
});

ipcMain.handle("get-cookies", async (event, url) => {
    try {
        return await win.webContents.session.cookies.get({ url });
    } catch (err) {
        console.error(err);
        return [];
    }
});

ipcMain.handle("set-cookie", async (event, cookie) => {
    try {
        await win.webContents.session.cookies.set(cookie);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
});

ipcMain.handle("clear-cookies", async () => {
    try {
        await win.webContents.session.clearStorageData({
            storages: ["cookies"]
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
});
