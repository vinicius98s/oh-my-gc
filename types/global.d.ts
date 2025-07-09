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
    };
  }
}
