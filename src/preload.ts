import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getPort: () => ipcRenderer.invoke("get-port"),
});
