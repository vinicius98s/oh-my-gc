import { useState } from "react";
import { useDataContext } from "./DataContext";

import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import NavBar, { Page } from "./components/NavBar";
import UpdateModal from "./components/UpdateModal";
import UpdateBanner from "./components/UpdateBanner";

export default function App() {
  const { trackedCharacters } = useDataContext();
  const [currentPage, setCurrentPage] = useState<Page>("home");

  // Show Onboarding if no tracked characters (one-time flow)
  if (trackedCharacters.length === 0) {
    return <Onboarding />;
  }

  return (
    <div className="flex flex-col h-full">
      <NavBar currentPage={currentPage} onNavigate={setCurrentPage} />
      <UpdateBanner />
      <div className="flex-1 min-h-0">
        {currentPage === "home" && <Home />}
        {currentPage === "statistics" && <Statistics />}
        {currentPage === "settings" && <Settings />}
      </div>
      <UpdateModal />
    </div>
  );
}
