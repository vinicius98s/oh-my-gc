if (require("electron-squirrel-startup")) {
  process.exit();
}

import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
  autoUpdater,
} from "electron";
import net from "net";
import path from "path";
import fs from "fs";

import { BackendManager } from "./BackendManager";
import { cleanUpOldVersions } from "./utils/cleanup";

const initUpdater = () => {
  if (!app.isPackaged) return;

  const url = `https://update.electronjs.org/vinicius98s/oh-my-gc/${process.platform}-${process.arch}/${app.getVersion()}`;

  try {
    autoUpdater.setFeedURL({ url });
  } catch (err: any) {
    logToFile(`Failed to set feed URL: ${err.message}`);
    return;
  }

  autoUpdater.on("checking-for-update", () => {
    logToFile("Checking for updates...");
  });

  autoUpdater.on("update-available", () => {
    logToFile("Update available, starting download...");
    mainWindow?.webContents.send("update-available", "new version");
  });

  autoUpdater.on("update-not-available", () => {
    logToFile("Update not available.");
    mainWindow?.webContents.send("update-not-available");
  });

  autoUpdater.on("error", (err) => {
    logToFile(`Updater error: ${err.message}`);
    mainWindow?.webContents.send("updater-error", err.message);
  });

  autoUpdater.on("update-downloaded", () => {
    logToFile("Update downloaded.");
    mainWindow?.webContents.send("update-downloaded");
  });

  // Check every 30 minutes
  setInterval(
    () => {
      autoUpdater.checkForUpdates();
    },
    30 * 60 * 1000,
  );

  autoUpdater.checkForUpdates();
};

if (!app.isPackaged) {
  ipcMain.on("debug-trigger-update", (event, status) => {
    switch (status) {
      case "available":
        mainWindow?.webContents.send("update-available", "1.1.0");
        break;
      case "progress":
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          mainWindow?.webContents.send("update-progress", progress);
          if (progress >= 100) {
            clearInterval(interval);
            mainWindow?.webContents.send("update-downloaded");
          }
        }, 500);
        break;
      case "error":
        mainWindow?.webContents.send(
          "updater-error",
          "Failed to fetch updates",
        );
        break;
    }
  });
}

ipcMain.on("download-update", () => {
  // Native autoUpdater handles download automatically on Windows/macOS
  logToFile(
    "download-update triggered, but native autoUpdater handles it automatically.",
  );
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
let tray: Tray | undefined;
let isQuitting = false;

const SETTINGS_PATH = path.join(app.getPath("userData"), "settings.json");
const LOG_PATH = path.join(app.getPath("userData"), "backend.log");

const logToFile = (message: string) => {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_PATH, `[${timestamp}] [Updater] ${message}\n`);
  } catch (err) {
    console.error("Failed to write to log file", err);
  }
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read settings", e);
  }
  return {
    quitOnClose: false,
    showOverlay: true,
    overlayX: null as number | null,
    overlayY: null as number | null,
  };
}

function saveSettings(settings: {
  quitOnClose: boolean;
  showOverlay: boolean;
  overlayX: number | null;
  overlayY: number | null;
}) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

let settings = getSettings();

const getIconPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "icon.ico");
  }
  return path.join(__dirname, "../../src/assets/icon.ico");
};

const createTray = () => {
  const iconPath = getIconPath();
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: "Toggle Overlay",
      click: () => {
        if (overlayWindow) {
          overlayWindow.close();
          overlayWindow = undefined;
        } else {
          createOverlayWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Oh My GC");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
};

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
    icon: getIconPath(),
  });

  mainWindow.setResizable(false);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  ipcMain.handle("get-port", () => port);

  ipcMain.handle("get-startup-setting", () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.on("set-startup-setting", (_, openAtLogin: boolean) => {
    app.setLoginItemSettings({
      openAtLogin,
      path: app.getPath("exe"),
      args: ["--hidden"],
    });
  });

  ipcMain.handle("get-quit-on-close", () => {
    return settings.quitOnClose;
  });

  ipcMain.on("set-quit-on-close", (_, quitOnClose: boolean) => {
    settings.quitOnClose = quitOnClose;
    saveSettings(settings);
  });

  ipcMain.handle("get-show-overlay", () => {
    return settings.showOverlay;
  });

  ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setIgnoreMouseEvents(ignore, options);
    }
  });

  ipcMain.on("resize-overlay", (event, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && win === overlayWindow) {
      const [width] = win.getContentSize();
      win.setContentSize(width, Math.round(height));
    }
  });

  ipcMain.on("set-show-overlay", (_, showOverlay: boolean) => {
    settings.showOverlay = showOverlay;
    saveSettings(settings);
    if (showOverlay) {
      createOverlayWindow();
    } else {
      overlayWindow?.close();
      overlayWindow = undefined;
    }
    mainWindow?.webContents.send("overlay-setting-changed", showOverlay);
  });

  ipcMain.on("toggle-overlay", () => {
    if (overlayWindow) {
      overlayWindow.close();
      overlayWindow = undefined;
    } else {
      createOverlayWindow();
    }
  });

  ipcMain.on("minimize-window", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("close-window", () => {
    if (settings.quitOnClose) {
      isQuitting = true;
      app.quit();
    } else {
      mainWindow?.hide();
    }
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting && !settings.quitOnClose) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (process.argv.includes("--hidden")) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }

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

app.on("ready", async () => {
  await cleanUpOldVersions();
  createTray();
  await createWindow();
  initUpdater();
  if (settings.showOverlay) {
    createOverlayWindow();
  }
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
    if (settings.showOverlay && !overlayWindow) {
      createOverlayWindow();
    }
  }
});

let overlayWindow: BrowserWindow | undefined;

const createOverlayWindow = () => {
  if (overlayWindow) return;

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const overlayWidth = 320;
  const overlayHeight = 110; // Renderer will correct this
  const defaultX = screenWidth - overlayWidth - 10;
  const defaultY = 200;

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    x: settings.overlayX ?? defaultX,
    y: settings.overlayY ?? defaultY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    movable: true,
    focusable: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    type: "panel",
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "floating");
  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.setFullScreenable(false);

  overlayWindow.on("move", () => {
    if (overlayWindow) {
      const [x, y] = overlayWindow.getPosition();
      settings.overlayX = x;
      settings.overlayY = y;
      saveSettings(settings);
    }
  });

  overlayWindow.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?overlay=true`);

  overlayWindow.on("closed", () => {
    overlayWindow = undefined;
  });
};
