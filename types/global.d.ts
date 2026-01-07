export {};

declare global {
  interface Window {
    version: string;
    api: {
      getPort: () => Promise<number>;
    };
    electronAPI?: {
      setIgnoreMouseEvents: (
        ignore: boolean,
        options?: { forward: boolean }
      ) => void;
    };
    electron: {
      getStartupSetting: () => Promise<boolean>;
      getQuitOnClose: () => Promise<boolean>;
      getShowOverlay: () => Promise<boolean>;
      setQuitOnClose: (quitOnClose: boolean) => void;
      setShowOverlay: (showOverlay: boolean) => void;
      toggleOverlay: () => void;
      setStartupSetting: (startup: boolean) => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      onUpdateAvailable: (callback: (version: string) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      downloadUpdate: () => void;
      installUpdate: () => void;
      onOverlaySettingChanged: (
        callback: (value: boolean) => void
      ) => () => void;
    };
  }
}
