import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import TitleBar from "./components/TitleBar";
import Overlay from "./components/Overlay";
import { DataContextProvider } from "./DataContext";

const queryClient = new QueryClient();

const isOverlay = window.location.search.includes("overlay=true");
if (isOverlay) {
  document.documentElement.classList.add("overlay");
}

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {isOverlay ? (
        <DataContextProvider>
          <Overlay />
        </DataContextProvider>
      ) : (
        <div className="flex flex-col h-screen">
          <TitleBar />
          <div className="flex-1 min-h-0 overflow-hidden">
            <DataContextProvider>
              <App />
            </DataContextProvider>
          </div>
        </div>
      )}
    </QueryClientProvider>
  </React.StrictMode>
);
