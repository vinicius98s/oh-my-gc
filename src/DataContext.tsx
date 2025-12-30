import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import {
  Character,
  getCharacterById,
  getCharacters,
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
  characters: Character[];
  dungeons: DungeonsResponse;
  dungeonsEntries: DungeonsEntriesResponse;
  playingCharacter?: Character | null;
  playingDungeonId?: number | null;
  recommendedCharacter?: RecommendationResponse;
  setRecommendation: (rec: RecommendationResponse | null) => void;
  url: string;
  statistics?: StatisticsData;
  updateStatus: "idle" | "available" | "downloading" | "downloaded";
  setUpdateStatus: (
    status: "idle" | "available" | "downloading" | "downloaded"
  ) => void;
  newVersion: string;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  isUpdateBannerVisible: boolean;
  setIsUpdateBannerVisible: (visible: boolean) => void;
};

const DataContext = createContext<DataContextType>({
  trackedCharacters: [],
  characters: [],
  dungeons: [],
  dungeonsEntries: [],
  playingCharacter: null,
  playingDungeonId: null,
  recommendedCharacter: null,
  setRecommendation: () => {},
  url: "",
  statistics: undefined,
  updateStatus: "idle",
  setUpdateStatus: () => {},
  newVersion: "",
  isUpdateModalOpen: false,
  setIsUpdateModalOpen: () => {},
  isUpdateBannerVisible: false,
  setIsUpdateBannerVisible: () => {},
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
  const [playingDungeonId, setPlayingDungeonId] = useState<number | null>(null);
  const [playingCharacter, setPlayingCharacter] = useState<
    Character | null | undefined
  >(null);
  const [recommendation, setRecommendation] =
    useState<RecommendationResponse | null>(null);

  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "available" | "downloading" | "downloaded"
  >("idle");
  const [newVersion, setNewVersion] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUpdateBannerVisible, setIsUpdateBannerVisible] = useState(false);

  const url = `http://localhost:${port}`;

  const queryClient = useQueryClient();

  const { data: dungeons } = useQuery<DungeonsResponse>({
    queryKey: ["dungeons"],
    queryFn: () => getDungeons(url),
    enabled: !!port,
  });

  const { data: characters } = useQuery<Character[]>({
    queryKey: ["characters"],
    queryFn: () => getCharacters(url),
    enabled: !!port,
  });

  const { data: trackedCharacters } = useQuery<TrackedCharactersResponse>({
    queryKey: ["tracked_characters"],
    queryFn: () => getTrackedCharacters(url),
    enabled: !!port,
  });

  const { data: dungeonsEntries } = useQuery<DungeonsEntriesResponse>({
    queryKey: ["dungeons_entries"],
    queryFn: () => getDungeonsEntries(url, null),
    enabled: !!port,
    staleTime: Infinity,
  });

  const { data: statistics } = useQuery<StatisticsData>({
    queryKey: ["statistics"],
    queryFn: () => getStatistics(url),
    enabled: !!port,
  });

  const { data: recommendedCharacter } = useQuery<RecommendationResponse>({
    queryKey: ["recommendation", playingCharacter?.id, playingDungeonId],
    queryFn: () =>
      getNextCharacterRecommendation(
        url,
        playingCharacter?.id || null,
        playingDungeonId || null
      ),
    enabled: !!port && playingDungeonId !== null,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (playingCharacter?.id === recommendation?.recommendation?.id) {
      setRecommendation(null);
    }

    if (!!recommendedCharacter) {
      setRecommendation(recommendedCharacter);
    }
  }, [recommendedCharacter, playingCharacter]);

  useEffect(() => {
    window.api.getPort().then(setPort);

    window.electron.onUpdateAvailable((version) => {
      setNewVersion(version);
      setUpdateStatus("available");
      setIsUpdateModalOpen(true);
      setIsUpdateBannerVisible(false);
    });

    window.electron.onUpdateDownloaded(() => {
      setUpdateStatus("downloaded");
      setIsUpdateModalOpen(true);
      setIsUpdateBannerVisible(false);
    });
  }, []);

  useEffect(() => {
    if (port) {
      const evtSource = new EventSource(`${url}/events`);

      evtSource.addEventListener("character", (e: MessageEvent) => {
        if (characters) {
          setPlayingCharacter(getCharacterById(e.data, characters));
        }
      });

      evtSource.addEventListener("dungeons", (e: MessageEvent) => {
        const { type, dungeon_id } = JSON.parse(e.data.replaceAll("'", '"'));
        switch (type) {
          case "started_dungeon":
            queryClient.invalidateQueries({ queryKey: ["recommendation"] });
            setPlayingDungeonId(dungeon_id);
            break;

          case "not_playing":
            setPlayingDungeonId(null);
            break;

          case "completed_dungeon":
            setPlayingDungeonId(null);
            queryClient.invalidateQueries({ queryKey: ["dungeons_entries"] });
            queryClient.invalidateQueries({ queryKey: ["statistics"] });
            break;
        }
      });
    }
  }, [port, characters]);

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
        characters: characters || [],
        playingCharacter,
        url,
        dungeons,
        dungeonsEntries,
        playingDungeonId,
        statistics,
        recommendedCharacter: recommendation,
        setRecommendation,
        updateStatus,
        setUpdateStatus,
        newVersion,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        isUpdateBannerVisible,
        setIsUpdateBannerVisible,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
