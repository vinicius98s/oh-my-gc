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
import { getInventory, InventoryItem } from "./utils/inventory";
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
  updateStatus: "idle" | "available" | "downloading" | "downloaded" | "error";
  setUpdateStatus: (
    status: "idle" | "available" | "downloading" | "downloaded" | "error",
  ) => void;
  updateProgress: number;
  updateError?: string;
  newVersion: string;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  isUpdateBannerVisible: boolean;
  setIsUpdateBannerVisible: (visible: boolean) => void;
  inventory?: InventoryItem[];
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
  updateProgress: 0,
  newVersion: "",
  isUpdateModalOpen: false,
  setIsUpdateModalOpen: () => {},
  isUpdateBannerVisible: false,
  setIsUpdateBannerVisible: () => {},
  inventory: [],
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
    "idle" | "available" | "downloading" | "downloaded" | "error"
  >("idle");
  const [newVersion, setNewVersion] = useState("");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string>();
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
        playingDungeonId || null,
      ),
    enabled: !!port && playingDungeonId !== null,
    staleTime: Infinity,
  });

  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => getInventory(url),
    enabled: !!port,
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

    window.electron.onUpdateNotAvailable(() => {
      setUpdateStatus("idle");
    });

    window.electron.onUpdateDownloaded(() => {
      setUpdateStatus("downloaded");
      setIsUpdateModalOpen(true);
      setIsUpdateBannerVisible(false);
    });

    window.electron.onUpdateError((error) => {
      setUpdateError(error);
      setUpdateStatus("error");
    });

    window.electron.onUpdateProgress((percent) => {
      setUpdateProgress(percent);
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

      evtSource.addEventListener("window_status", (e: MessageEvent) => {
        const { visible } = JSON.parse(e.data.replaceAll("'", '"'));
        (window as any).electronAPI.setOverlayVisibility(visible);
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
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            break;
        }
      });
    }
  }, [port, characters]);

  if (!port || !trackedCharacters || !dungeons || !dungeonsEntries) {
    return (
      <div className="h-full items-center justify-center flex">
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
        updateProgress,
        updateError,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        isUpdateBannerVisible,
        setIsUpdateBannerVisible,
        inventory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
