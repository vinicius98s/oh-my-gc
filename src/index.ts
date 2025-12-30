if (require("electron-squirrel-startup")) {
  process.exit();
}

import { app, BrowserWindow, ipcMain } from "electron";
import net from "net";
import path from "path";
import { autoUpdater } from "electron-updater";

import { BackendManager } from "./BackendManager";
import { cleanUpOldVersions } from "./utils/cleanup";

if (app.isPackaged) {
  autoUpdater.autoDownload = false;

  autoUpdater.on("update-available", (info) => {
    mainWindow?.webContents.send("update-available", info.version);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("update-downloaded");
  });

  autoUpdater.checkForUpdatesAndNotify();
}

ipcMain.on("download-update", () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on("install-update", () => {
  autoUpdater.quitAndInstall();
});

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

function getRandomOpenPort(): number {
  if (!app.isPackaged) {
    return 5000;
  }

  const server = net.createServer();
  server.listen(0);
  const address = server.address();
  if (typeof address === "string") {
    throw new Error(`Cannot get port from address: ${address}`);
  }
  server.close();
  return address.port;
}

const backendManager = new BackendManager();
let mainWindow: BrowserWindow | undefined;
let isQuitting = false;

const createWindow = async () => {
  if (isQuitting) {
    return;
  }

  const port = getRandomOpenPort();

  if (!backendManager.isRunning()) {
    await backendManager.start(port);
  }

  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    frame: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    icon: path.join(__dirname, "../../src/assets/icon.ico"),
  });

  mainWindow.setResizable(false);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  ipcMain.handle("get-port", () => port);

  ipcMain.on("minimize-window", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("close-window", () => {
    mainWindow?.close();
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["connect-src 'self' http://localhost:*;"],
        },
      });
    }
  );
};

app.on("ready", async () => {
  await cleanUpOldVersions();
  createWindow();
});

app.on("before-quit", async (event) => {
  if (isQuitting) {
    return;
  }

  isQuitting = true;
  event.preventDefault();

  await backendManager.kill();

  app.exit(0);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (!isQuitting && !mainWindow) {
    await createWindow();
  }
});
