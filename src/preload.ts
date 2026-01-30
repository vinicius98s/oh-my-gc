import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getPort: () => ipcRenderer.invoke("get-port"),
});

contextBridge.exposeInMainWorld("electronAPI", {
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) =>
    ipcRenderer.send("set-ignore-mouse-events", ignore, options),
  resizeOverlay: (height: number) => ipcRenderer.send("resize-overlay", height),
  setOverlayVisibility: (visible: boolean) =>
    ipcRenderer.send("set-overlay-visibility", visible),
});

contextBridge.exposeInMainWorld("electron", {
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),
  closeWindow: () => ipcRenderer.send("close-window"),
  onUpdateAvailable: (callback: (version: string) => void) =>
    ipcRenderer.on("update-available", (_, version) => callback(version)),
  onUpdateNotAvailable: (callback: () => void) =>
    ipcRenderer.on("update-not-available", () => callback()),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on("update-downloaded", () => callback()),
  onUpdateError: (callback: (error: string) => void) =>
    ipcRenderer.on("updater-error", (_, error) => callback(error)),
  onUpdateProgress: (callback: (percent: number) => void) =>
    ipcRenderer.on("update-progress", (_, percent) => callback(percent)),
  downloadUpdate: () => ipcRenderer.send("download-update"),
  installUpdate: () => ipcRenderer.send("install-update"),
  getStartupSetting: () => ipcRenderer.invoke("get-startup-setting"),
  setStartupSetting: (value: boolean) =>
    ipcRenderer.send("set-startup-setting", value),
  getQuitOnClose: () => ipcRenderer.invoke("get-quit-on-close"),
  setQuitOnClose: (value: boolean) =>
    ipcRenderer.send("set-quit-on-close", value),
  getShowOverlay: () => ipcRenderer.invoke("get-show-overlay"),
  setShowOverlay: (value: boolean) =>
    ipcRenderer.send("set-show-overlay", value),
  toggleOverlay: () => ipcRenderer.send("toggle-overlay"),
  showMainWindow: () => ipcRenderer.send("show-main-window"),
  onOverlaySettingChanged: (callback: (value: boolean) => void) => {
    const subscription = (_event: any, value: boolean) => callback(value);
    ipcRenderer.on("overlay-setting-changed", subscription);
    return () => {
      ipcRenderer.removeListener("overlay-setting-changed", subscription);
    };
  },
});
