import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import { DataContextProvider } from "./DataContext";

const queryClient = new QueryClient();

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DataContextProvider>
        <App />
      </DataContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
