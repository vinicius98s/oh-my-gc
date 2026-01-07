import {
  useMemo,
  CSSProperties,
  useState,
  useLayoutEffect,
  useRef,
} from "react";
import { X } from "lucide-react";

import { useDataContext } from "../DataContext";
import {
  calculateDungeonsETC,
  formatETC,
  isDungeonComplete,
  getDungeonProgressText,
  getDungeonImage,
} from "../utils/dungeons";
import { getNextCharacter } from "../utils/schedule";
import RecommendedNext from "./RecommendedNext";
import TodayScheduleCard from "./TodayScheduleCard";
import { cn } from "../utils/lib";

export default function Overlay() {
  const {
    playingCharacter,
    playingDungeonId,
    dungeons,
    dungeonsEntries,
    trackedCharacters,
    recommendedCharacter,
    characters,
  } = useDataContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const nextCharacter = useMemo(() => {
    const result = getNextCharacter(recommendedCharacter, characters);
    return result;
  }, [recommendedCharacter, characters]);

  const { dayETC } = useMemo(() => {
    let totalSeconds = 0;
    let hasUnknown = false;
    let allFinished = true;
    let nextCharETC = {
      totalSeconds: 0,
      hasMissingData: false,
      isComplete: true,
    };

    for (const char of trackedCharacters) {
      const charScheduleIds = char.schedule?.[today] || [];
      const charDungeons = charScheduleIds
        .map((id) => {
          const d = dungeons.find((d) => d.id === id);
          if (!d) return null;
          const entry = dungeonsEntries.find(
            (e) => e.dungeonId === id && e.characterId === char.id
          ) || { entriesCount: 0, avgTime: null as number | null };
          return {
            ...d,
            entriesCount: entry.entriesCount,
            avgTime: entry.avgTime,
          } as any;
        })
        .filter((d) => !!d);

      const etc = calculateDungeonsETC(charDungeons);

      // Calculate ETC for next character
      if (nextCharacter && char.id === nextCharacter.id) {
        nextCharETC = etc;
      }

      totalSeconds += etc.totalSeconds;
      if (etc.hasMissingData) hasUnknown = true;
      if (!etc.isComplete) allFinished = false;
    }

    return {
      dayETC: {
        totalSeconds,
        hasMissingData: hasUnknown,
        isComplete: allFinished,
      },
      nextCharacterETC: nextCharETC,
    };
  }, [trackedCharacters, today, dungeons, dungeonsEntries, nextCharacter]);

  // Calculate current character ETC
  const { currentCharDungeons, currentCharacterETC } = useMemo(() => {
    if (!playingCharacter) {
      return { currentCharDungeons: [], currentCharacterETC: null };
    }
    const trackedChar = trackedCharacters.find(
      (tc) => tc.id === playingCharacter.id
    );
    const currentCharScheduleIds = trackedChar?.schedule?.[today] || [];
    const dungeons_list = currentCharScheduleIds
      .map((id: number) => {
        const d = dungeons.find((d) => d.id === id);
        if (!d) return null;
        const entry = dungeonsEntries.find(
          (e) => e.dungeonId === id && e.characterId === playingCharacter.id
        ) || { entriesCount: 0, avgTime: null as number | null };
        return {
          ...d,
          image: getDungeonImage(d.id),
          entriesCount: entry.entriesCount,
          avgTime: entry.avgTime,
        } as any;
      })
      .filter((d): d is NonNullable<typeof d> => !!d);

    return {
      currentCharDungeons: dungeons_list,
      currentCharacterETC: calculateDungeonsETC(dungeons_list),
    };
  }, [playingCharacter, trackedCharacters, today, dungeons, dungeonsEntries]);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          (window as any).electronAPI.resizeOverlay(height);
        }
      }
    };

    updateHeight();

    const currentRef = containerRef.current;
    if (!currentRef) return;

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [isExpanded, playingCharacter, currentCharDungeons.length]);

  if (!playingCharacter) {
    return (
      <div className="w-full">
        <div
          ref={containerRef}
          style={{ WebkitAppRegion: "drag" } as CSSProperties}
          className="h-fit w-full bg-gray/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex flex-col gap-2 text-white relative select-none overflow-hidden group"
        >
          <button
            onClick={() => (window as any).electron.toggleOverlay()}
            className="absolute top-1 right-1 p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all no-drag z-50 opacity-100"
          >
            <X size={10} />
          </button>
          <div className="flex items-center gap-3 pr-2">
            <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-lg shadow-inner border border-white/5 flex-shrink-0">
              <span>🎮</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                Status
              </p>
              <p className="text-xs font-semibold truncate text-gray-100">
                Waiting for character...
              </p>
            </div>
          </div>

          {(nextCharacter || recommendedCharacter?.isAllDone) && (
            <div className="h-[1px] bg-white/10" />
          )}
          <RecommendedNext
            nextCharacter={nextCharacter}
            isAllDone={recommendedCharacter?.isAllDone}
            variant="compact"
          />
        </div>
      </div>
    );
  }

  const dungeon = dungeons.find((d) => d.id === playingDungeonId);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        style={{ WebkitAppRegion: "drag" } as CSSProperties}
        className="h-fit w-full bg-gray/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex flex-col gap-2 text-white relative overflow-hidden select-none group"
      >
        <button
          onClick={() => (window as any).electron.toggleOverlay()}
          className="absolute top-1 right-1 p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all no-drag z-50 opacity-100"
        >
          <X size={10} />
        </button>
        {/* Background Glow */}
        <div
          className="absolute inset-0 opacity-20 blur-2xl -z-10 group-hover:opacity-30 transition-opacity duration-500"
          style={{
            background: `linear-gradient(to right, ${playingCharacter.colorTheme.from}, ${playingCharacter.colorTheme.to})`,
          }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-shrink-0">
            <div
              className="absolute -inset-1 rounded-full opacity-50 blur-sm"
              style={{
                background: `linear-gradient(to right, ${playingCharacter.colorTheme.from}, ${playingCharacter.colorTheme.to})`,
              }}
            />
            <img
              src={playingCharacter.image}
              alt={playingCharacter.displayName}
              className="relative h-11 w-11 rounded-full border-2 object-cover shadow-lg"
              style={{ borderColor: playingCharacter.colorTheme.from }}
            />
            {dungeon && (
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-green-500 p-1 ring-2 ring-gray-900 shadow-md">
                <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
              {dungeon ? "Exploring" : "In Lobby"}
            </p>
            <h2 className="text-sm font-black tracking-tight truncate drop-shadow-sm">
              {playingCharacter.displayName}
            </h2>
            {dungeon && (
              <p className="text-[10px] text-purple-300 font-medium truncate leading-tight flex items-center gap-1">
                <span className="size-1 rounded-full bg-purple-400/50" />
                {dungeon.displayName}
              </p>
            )}
          </div>

          <div className="pr-2">
            <RecommendedNext
              nextCharacter={nextCharacter}
              isAllDone={recommendedCharacter?.isAllDone}
              variant="compact"
            />
          </div>
        </div>

        <div className="h-[1px] bg-white/10 relative z-10" />

        <div className="flex-1 flex gap-3 relative z-10 text-[9px] items-center justify-center">
          <div className="flex flex-col text-center">
            <span className="text-gray-400 uppercase font-bold leading-tight">
              Character ETC
            </span>
            <span className="text-white font-bold text-[11px]">
              {currentCharacterETC?.isComplete ? (
                <span className="text-light-blue uppercase font-bold">
                  Done
                </span>
              ) : (
                <>
                  {formatETC(currentCharacterETC?.totalSeconds || 0)}
                  {currentCharacterETC?.hasMissingData && (
                    <span className="text-gray-500 text-[9px]">(+)</span>
                  )}
                </>
              )}
            </span>
          </div>
          <div className="self-stretch w-[1px] bg-white/10" />
          <div className="flex flex-col text-center">
            <span className="text-gray-400 uppercase font-bold leading-tight">
              Today ETC
            </span>
            <span className="text-white font-bold text-[11px]">
              {dayETC.isComplete ? (
                <span className="text-light-blue uppercase font-bold">
                  Done
                </span>
              ) : (
                <>
                  {formatETC(dayETC.totalSeconds)}
                  {dayETC.hasMissingData && (
                    <span className="text-gray-500 text-[9px]">(+)</span>
                  )}
                </>
              )}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center py-1 hover:bg-white/5 no-drag transition-colors rounded-md -mx-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "text-gray-400 transition-transform duration-200",
              isExpanded ? "rotate-180" : ""
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isExpanded && (
          <div className="flex flex-col gap-2 no-drag animate-in slide-in-from-top-2 duration-200">
            <div className="h-[1px] bg-white/10 mx-1" />
            <div className="flex flex-col gap-2 px-1">
              <p className="text-[10px] font-bold text-light-blue uppercase tracking-widest px-1">
                Schedule
              </p>
              <div className="flex flex-row gap-2 overflow-x-auto pb-1 scrollbar-none snap-x hover:scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {currentCharDungeons.map((dungeon: any) => (
                  <div key={dungeon.id} className="snap-start">
                    <TodayScheduleCard
                      dungeon={dungeon}
                      isComplete={isDungeonComplete(dungeon)}
                      progressText={getDungeonProgressText(dungeon)}
                      variant="mini"
                    />
                  </div>
                ))}
                {currentCharDungeons.length === 0 && (
                  <p className="text-[9px] text-gray-500 italic px-2 py-1">
                    Nothing scheduled
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
