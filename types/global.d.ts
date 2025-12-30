export {};

declare global {
  interface Window {
    api: {
      getPort: () => Promise<number>;
    };
    electron: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      onUpdateAvailable: (callback: (version: string) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      downloadUpdate: () => void;
      installUpdate: () => void;
    };
  }
}
