import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataContext } from "../DataContext";
import Button from "../components/Button";
import ScheduleBuilder, { ScheduleState } from "../components/ScheduleBuilder";
import { getNextCharacter } from "../utils/schedule";

import DungeonsList from "../components/DungeonsList";
import GameStatus from "../components/GameStatus";
import TodayScheduleCard from "../components/TodayScheduleCard";
import ScheduleETC from "../components/ScheduleETC";
import {
  formatDungeons,
  isDungeonComplete,
  getDungeonProgressText,
  calculateDungeonsETC,
} from "../utils/dungeons";

export default function Home() {
  const {
    playingCharacter,
    playingDungeonId,
    characters,
    dungeons,
    dungeonsEntries,
    trackedCharacters,
    recommendedCharacter,
    url,
    statistics,
    setRecommendation,
  } = useDataContext();

  const [isScheduleBuilderOpen, setIsScheduleBuilderOpen] = useState(false);
  const queryClient = useQueryClient();

  const scheduleMutation = useMutation({
    mutationFn: async (payload: {
      characters: number[];
      schedules: ScheduleState;
    }) => {
      const response = await fetch(`${url}/tracked_characters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const { data } = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked_characters"] });
      setRecommendation(null);
      setIsScheduleBuilderOpen(false);
    },
  });

  const handleSaveSchedule = (newSchedules: ScheduleState) => {
    if (!playingCharacter) return;
    scheduleMutation.mutate({
      characters: [playingCharacter.id],
      schedules: newSchedules,
    });
  };

  const formattedDungeons = useMemo(
    () =>
      formatDungeons(
        dungeons,
        dungeonsEntries.filter((e) => e.characterId === playingCharacter?.id)
      ),
    [dungeons, dungeonsEntries, playingCharacter?.id]
  );

  const sortedDungeons = useMemo(() => {
    return {
      hero: formattedDungeons.filter((d) => d.type === "hero-dungeon"),
      void: formattedDungeons.filter((d) => d.type === "void-raid-dungeon"),
      event: formattedDungeons.filter((d) => d.type === "event-dungeon"),
      anotherWorld: formattedDungeons.filter((d) => d.type === "another-world"),
    };
  }, [formattedDungeons]);

  const currentlyPlayingDungeon = useMemo(
    () => formattedDungeons.find((d) => d.id === playingDungeonId),
    [formattedDungeons, playingDungeonId]
  );

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const todayDungeons = useMemo(() => {
    const currentTrackedChar = trackedCharacters.find(
      (c) => c.id === playingCharacter?.id
    );
    const todayScheduleIds = currentTrackedChar?.schedule?.[today] || [];
    return todayScheduleIds
      .map((id) => formattedDungeons.find((d) => d.id === id))
      .filter((d) => !!d) as typeof formattedDungeons;
  }, [trackedCharacters, playingCharacter?.id, today, formattedDungeons]);

  const isCurrentScheduleComplete = useMemo(() => {
    if (!playingCharacter || todayDungeons.length === 0) return true;
    return todayDungeons.every(isDungeonComplete);
  }, [playingCharacter, todayDungeons]);

  const nextCharacter = useMemo(
    () => getNextCharacter(recommendedCharacter, characters),
    [recommendedCharacter, characters]
  );

  const characterETC = useMemo(
    () => calculateDungeonsETC(todayDungeons),
    [todayDungeons]
  );

  const dayETC = useMemo(() => {
    let totalSeconds = 0;
    let hasUnknown = false;
    let allFinished = true;

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
      totalSeconds += etc.totalSeconds;
      if (etc.hasMissingData) hasUnknown = true;
      if (!etc.isComplete) allFinished = false;
    }

    return {
      totalSeconds,
      hasMissingData: hasUnknown,
      isComplete: allFinished,
    };
  }, [trackedCharacters, today, dungeons, dungeonsEntries]);

  const isAllDone = statistics?.isAllDone ?? false;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="mb-8">
          <GameStatus
            character={playingCharacter}
            dungeon={currentlyPlayingDungeon}
            nextCharacter={nextCharacter}
            isAllDone={isAllDone}
          />
        </div>

        {playingCharacter && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  Today's Schedule:{" "}
                  <span className="text-light-blue">{today}</span>
                  <ScheduleETC characterETC={characterETC} dayETC={dayETC} />
                </h2>
                <Button
                  onClick={() => setIsScheduleBuilderOpen(true)}
                  className="text-xs px-3 py-1 font-medium text-white"
                >
                  Edit Schedule
                </Button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {todayDungeons.length > 0 ? (
                  todayDungeons.map((dungeon) => (
                    <TodayScheduleCard
                      key={dungeon.id}
                      dungeon={dungeon}
                      isComplete={isDungeonComplete(dungeon)}
                      progressText={getDungeonProgressText(dungeon)}
                    />
                  ))
                ) : (
                  <div className="text-gray-400 text-sm italic py-4">
                    No dungeons scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {sortedDungeons.hero.length > 0 && (
              <div>
                <p className="mb-4 text-light-blue font-bold tracking-wide uppercase text-xs">
                  Hero Dungeons
                </p>
                <DungeonsList dungeons={sortedDungeons.hero} />
              </div>
            )}

            {sortedDungeons.void.length > 0 && (
              <div className="mt-8">
                <p className="mb-4 text-light-blue font-bold tracking-wide uppercase text-xs">
                  Void Raid Dungeons
                </p>
                <DungeonsList dungeons={sortedDungeons.void} />
              </div>
            )}

            {sortedDungeons.anotherWorld.length > 0 && (
              <div className="mt-8">
                <p className="mb-4 text-light-blue font-bold tracking-wide uppercase text-xs">
                  Another World Dungeons
                </p>
                <DungeonsList dungeons={sortedDungeons.anotherWorld} />
              </div>
            )}

            {sortedDungeons.event.length > 0 && (
              <div className="mt-8">
                <p className="mb-4 text-light-blue font-bold tracking-wide uppercase text-xs">
                  Event Dungeons
                </p>
                <DungeonsList dungeons={sortedDungeons.event} />
              </div>
            )}
          </>
        )}
      </div>

      {isScheduleBuilderOpen &&
        playingCharacter &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-10 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsScheduleBuilderOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 size-10 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                ✕
              </button>
              <div className="p-6 h-full flex flex-col">
                <h2 className="text-md font-bold mb-6 text-white">
                  Edit Schedule
                </h2>
                <div className="flex-1 min-h-0">
                  <ScheduleBuilder
                    selectedCharacterIds={[playingCharacter.id]}
                    initialSchedules={{
                      [playingCharacter.id]:
                        trackedCharacters.find(
                          (c) => c.id === playingCharacter.id
                        )?.schedule || {},
                    }}
                    onConfirm={handleSaveSchedule}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
