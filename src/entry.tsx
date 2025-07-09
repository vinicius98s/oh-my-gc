import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import TitleBar from "./components/TitleBar";
import { DataContextProvider } from "./DataContext";

const queryClient = new QueryClient();

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen">
        <TitleBar />
        <div className="px-10">
          <DataContextProvider>
            <App />
          </DataContextProvider>
        </div>
      </div>
    </QueryClientProvider>
  </React.StrictMode>,
);
