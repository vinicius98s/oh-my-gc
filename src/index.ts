if (require("electron-squirrel-startup")) {
  process.exit();
}

import { app, BrowserWindow, ipcMain } from "electron";
import net from "net";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { updateElectronApp } from "update-electron-app";

updateElectronApp();

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

let backendProcess: ChildProcessWithoutNullStreams | undefined;

const createWindow = () => {
  const port = getRandomOpenPort();

  if (app.isPackaged) {
    const dataPath = app.getPath("userData");
    const logPath = path.join(dataPath, "backend.log");
    const logStream = fs.createWriteStream(logPath, { flags: "a" });

    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    const dbPath = path.join(dataPath, "oh-my-gc.sqlite3");

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "");
    }

    const tesseractPath = path.join(
      process.resourcesPath,
      "third-party",
      "tesseract-win64",
      "tesseract.exe"
    );
    const migrationsPath = path.join(process.resourcesPath, "migrations");
    const templatesPath = path.join(process.resourcesPath, "templates");
    const backendPath = path.join(process.resourcesPath, "main.exe");

    backendProcess = spawn(
      backendPath,
      [
        `--port=${port}`,
        `--user-data=${dataPath}`,
        `--templates=${templatesPath}`,
        `--TESSERACT_PATH=${tesseractPath}`,
        `--migrations=${migrationsPath}`,
      ],
      {
        cwd: process.resourcesPath,
        env: { ...process.env },
        detached: false,
        windowsHide: true,
      }
    );

    backendProcess.stdout.pipe(logStream);
    backendProcess.stderr.pipe(logStream);

    backendProcess.on("error", (err) => {
      fs.appendFileSync(logPath, `Failed to start backend: ${err.message}\n`);
    });

    backendProcess.on("exit", (code) => {
      fs.appendFileSync(logPath, `Backend process exited with code ${code}\n`);
    });
  }

  const mainWindow = new BrowserWindow({
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
    mainWindow.minimize();
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
    }
  );
};

app.on("ready", createWindow);

const killBackend = () => {
  if (backendProcess && backendProcess.pid) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", backendProcess.pid.toString(), "/f", "/t"]);
    } else {
      backendProcess.kill();
    }
  }
};

app.on("before-quit", killBackend);
app.on("will-quit", killBackend);

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
