import { app, BrowserWindow, ipcMain } from "electron";
import net from "net";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
  app.quit();
}

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

let backendProcess: ChildProcessWithoutNullStreams | undefined;

const createWindow = () => {
  const port = getRandomOpenPort();
  if (app.isPackaged) {
    const tesseractPath = path.join(
      process.resourcesPath,
      "third-party",
      "tesseract-win64",
      "tesseract.exe",
    );
    const dataPath = path.join(process.resourcesPath, "data");
    const backendPath = path.join(process.resourcesPath, "main.exe");
    backendProcess = spawn(backendPath, [
      `--port=${port}`,
      `--data=${dataPath}`,
      `--TESSERACT_PATH=${tesseractPath}`,
    ]);
  }

  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    frame: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    icon: path.join(__dirname, "../../src/assets/icon.png"),
  });

  mainWindow.setResizable(false);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  ipcMain.handle("get-port", () => port);

  ipcMain.on("minimize-window", () => {
    mainWindow.minimize();
  });

  ipcMain.on("maximize-window", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on("close-window", () => {
    mainWindow.close();
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["connect-src 'self' http://localhost:*;"],
        },
      });
    },
  );
};

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

app.on("will-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
