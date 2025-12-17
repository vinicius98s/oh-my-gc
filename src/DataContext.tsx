import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  playingCharacter?: Character | null;
  playingDungeon?: string | null;
  url: string;
};

const DataContext = createContext<DataContextType>({
  trackedCharacters: [],
  dungeons: [],
  dungeonsEntries: [],
  playingCharacter: null,
  playingDungeon: null,
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
  const [playingDungeon, setPlayingDungeon] = useState<string | null>(null);
  const [playingCharacter, setPlayingCharacter] = useState<
    Character | null | undefined
  >(null);

  const url = `http://localhost:${port}`;

  const queryClient = useQueryClient();

  const { data: dungeons } = useQuery<DungeonsResponse>({
    queryKey: ["dungeons"],
    queryFn: () => getDungeons(url),
  });

  const { data: trackedCharacters } = useQuery<TrackedCharactersResponse>({
    queryKey: ["tracked_characters"],
    queryFn: () => getTrackedCharacters(url),
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

      evtSource.addEventListener("dungeons", (e: MessageEvent) => {
        const { type, dungeon } = JSON.parse(e.data.replaceAll("'", '"'));
        switch (type) {
          case "start":
            setPlayingDungeon(dungeon);
            break;

          case "not_playing":
            setPlayingDungeon(null);
            break;

          case "completed":
            setPlayingDungeon(null);
            queryClient.invalidateQueries({ queryKey: ["dungeons_entries"] });
            break;
        }
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
        playingDungeon,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
