import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import {
  Character,
  getCharacterById,
  getNextCharacterRecommendation,
  getTrackedCharacters,
  RecommendationResponse,
  TrackedCharactersResponse,
} from "./utils/characters";
import {
  DungeonsEntriesResponse,
  DungeonsResponse,
  getDungeons,
  getDungeonsEntries,
  getStatistics,
  StatisticsData,
} from "./utils/dungeons";
import Loading from "./components/Loading";

type DataContextType = {
  trackedCharacters: TrackedCharactersResponse;
  dungeons: DungeonsResponse;
  dungeonsEntries: DungeonsEntriesResponse;
  playingCharacter?: Character | null;
  playingDungeon?: string | null;
  recommendedCharacter?: RecommendationResponse;
  url: string;
  statistics?: StatisticsData;
};

const DataContext = createContext<DataContextType>({
  trackedCharacters: [],
  dungeons: [],
  dungeonsEntries: [],
  playingCharacter: null,
  playingDungeon: null,
  recommendedCharacter: null,
  url: "",
  statistics: undefined,
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
    enabled: !!port,
  });

  const { data: trackedCharacters } = useQuery<TrackedCharactersResponse>({
    queryKey: ["tracked_characters"],
    queryFn: () => getTrackedCharacters(url),
    enabled: !!port,
  });

  const { data: dungeonsEntries } = useQuery<DungeonsEntriesResponse>({
    queryKey: ["dungeons_entries", playingCharacter?.id],
    queryFn: () => getDungeonsEntries(url, playingCharacter?.id || null),
    enabled: !!port,
    staleTime: Infinity,
  });

  const { data: statistics } = useQuery<StatisticsData>({
    queryKey: ["statistics"],
    queryFn: () => getStatistics(url),
    enabled: !!port,
  });

  const { data: recommendedCharacter } = useQuery<RecommendationResponse>({
    queryKey: ["recommendation", playingCharacter?.id, playingDungeon],
    queryFn: () =>
      getNextCharacterRecommendation(
        url,
        playingCharacter?.id || null,
        playingDungeon || null
      ),
    enabled: !!port,
    staleTime: Infinity,
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
            queryClient.invalidateQueries({ queryKey: ["recommendation"] });
            queryClient.invalidateQueries({ queryKey: ["statistics"] });
            break;
        }
      });
    }
  }, [port]);

  if (!port || !trackedCharacters || !dungeons || !dungeonsEntries) {
    return (
      <div className="h-screen items-center justify-center flex">
        <Loading />
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
        dungeonsEntries: dungeonsEntries || [],
        playingDungeon,
        statistics,
        recommendedCharacter,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
