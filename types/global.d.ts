export {};

declare global {
  interface Window {
    api: {
      getPort: () => Promise<number>;
    };
  }
}
