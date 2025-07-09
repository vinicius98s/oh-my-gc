import { useDataContext } from "./DataContext";

import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";

export default function App() {
  const { trackedCharacters } = useDataContext();

  if (trackedCharacters.length === 0) {
    return <Onboarding />;
  }

  return (
    <Home />
  );
}
