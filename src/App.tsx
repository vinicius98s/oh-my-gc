import { useQuery } from "@tanstack/react-query";

import { useDataContext } from "./DataContext";

import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";

export default function App() {
  const { url } = useDataContext();

  const { data, isPending } = useQuery({
    queryKey: ["tracked_characters"],
    queryFn: async () => {
      const response = await fetch(`${url}/tracked_characters`);
      return response.json();
    },
  });

  if (!isPending && data.length === 0) {
    return <Onboarding />;
  }

  return <Home />;
}
