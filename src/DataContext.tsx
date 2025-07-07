import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import {
  Character,
  getCharacterById,
  getTrackedCharacters,
  TrackedCharactersResponse,
} from "./utils/characters";
import {
  DungeonsEntriesResponse,
  DungeonsResponse,
  getDungeons,
  getDungeonsEntries,
} from "./utils/dungeons";

type DataContextType = {
  trackedCharacters: TrackedCharactersResponse;
  dungeons: DungeonsResponse;
  dungeonsEntries: DungeonsEntriesResponse;
  playingCharacter: Character | null;
  url: string;
};

const DataContext = createContext<DataContextType>({
  trackedCharacters: [],
  dungeons: [],
  dungeonsEntries: [],
  playingCharacter: null,
  url: "",
});

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useDataContext must be used within a DataContextProvider");
  }

  return ctx;
}

export function DataContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [port, setPort] = useState<number>();
  const [playingCharacter, setPlayingCharacter] = useState<Character | null>(
    null,
  );

  const url = `http://localhost:${port}`;

  const { data: trackedCharacters } = useQuery<TrackedCharactersResponse>({
    queryKey: ["tracked_characters"],
    queryFn: () => getTrackedCharacters(url),
  });

  const { data: dungeons } = useQuery<DungeonsResponse>({
    queryKey: ["dungeons"],
    queryFn: () => getDungeons(url),
  });

  const { data: dungeonsEntries } = useQuery<DungeonsEntriesResponse>({
    queryKey: ["dungeons_entries"],
    queryFn: () => getDungeonsEntries(url),
  });

  useEffect(() => {
    window.api.getPort().then(setPort);
  }, []);

  useEffect(() => {
    if (port) {
      const evtSource = new EventSource(`${url}/events`);
      evtSource.addEventListener("character", (e: MessageEvent) => {
        setPlayingCharacter(getCharacterById(e.data));
      });
    }
  }, [port]);

  if (!port || !trackedCharacters || !dungeons || !dungeonsEntries) {
    return (
      <div className="h-screen items-center justify-center flex">
        Loading...
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        trackedCharacters,
        playingCharacter,
        url,
        dungeons,
        dungeonsEntries,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
