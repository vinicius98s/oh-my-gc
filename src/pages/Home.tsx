import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataContext } from "../DataContext";
import Button from "../components/Button";
import ScheduleBuilder, { ScheduleState } from "../components/ScheduleBuilder";
import { getCharacterById } from "../utils/characters";

import DungeonsList from "../components/DungeonsList";
import GameStatus from "../components/GameStatus";
import TodayScheduleCard from "../components/TodayScheduleCard";
import { formatDungeons } from "../utils/dungeons";

export default function Home() {
  const {
    playingCharacter,
    playingDungeon,
    dungeons,
    dungeonsEntries,
    trackedCharacters,
    url,
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

  const formattedDungeons = formatDungeons(dungeons, dungeonsEntries);

  const heroDungeons = formattedDungeons.filter(
    (d) => d.type === "hero-dungeon"
  );
  const voidRaidDungeons = formattedDungeons.filter(
    (d) => d.type === "void-raid-dungeon"
  );
  const eventDungeons = formattedDungeons.filter(
    (d) => d.type === "event-dungeon"
  );
  const anotherWorldDungeons = formattedDungeons.filter(
    (d) => d.type === "another-world"
  );

  const currentlyPlayingDungeon = [
    ...heroDungeons,
    ...voidRaidDungeons,
    ...eventDungeons,
    ...anotherWorldDungeons,
  ].find((dungeon) => dungeon.name === playingDungeon);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const currentTrackedChar = trackedCharacters.find(
    (c) => c.id === playingCharacter?.id
  );
  const todayScheduleIds = currentTrackedChar?.schedule?.[today] || [];
  const todayDungeons = todayScheduleIds
    .map((id) => formattedDungeons.find((d) => d.id === id))
    .filter((d) => !!d);

  const isCurrentScheduleComplete =
    !currentTrackedChar ||
    todayDungeons.every((d) => {
      const dailyEntries =
        d!.charactersDailyEntries.find(
          (entry) => entry.character_id === playingCharacter.id
        )?.entries_count || 0;

      const weeklyEntries =
        d!.charactersWeeklyEntries.find(
          (entry) => entry.character_id === playingCharacter.id
        )?.entries_count || 0;

      const isDailyComplete =
        d!.dailyEntryLimit > 0 && dailyEntries >= d!.dailyEntryLimit;
      const isWeeklyComplete =
        d!.weeklyEntryLimit > 0 && weeklyEntries >= d!.weeklyEntryLimit;

      return isDailyComplete || isWeeklyComplete;
    });

  const nextCharacter = useMemo(() => {
    if (!isCurrentScheduleComplete) return undefined;

    // Find next character with incomplete schedule
    const otherTracked = trackedCharacters.filter(
      (c) => c.id !== playingCharacter?.id
    );

    // Try to follow the order in trackedCharacters list which mimics user selection order usually
    // But we need to rotate to find the one "after" the current if we want a strict cycle,
    // or just find *any* pending. The requirement says "next character", usually implying order.
    // Let's just find the first one in the list that isn't done, for simplicity and UX.

    for (const char of otherTracked) {
      const charScheduleIds = char.schedule?.[today] || [];
      if (charScheduleIds.length === 0) continue;

      const charDungeons = charScheduleIds
        .map((id) => formattedDungeons.find((d) => d.id === id))
        .filter((d) => !!d);

      const isCharComplete = charDungeons.every((d) => {
        const dailyEntries =
          d!.charactersDailyEntries.find(
            (entry) => entry.character_id === char.id
          )?.entries_count || 0;

        const weeklyEntries =
          d!.charactersWeeklyEntries.find(
            (entry) => entry.character_id === char.id
          )?.entries_count || 0;

        const isDailyComplete =
          d!.dailyEntryLimit > 0 && dailyEntries >= d!.dailyEntryLimit;
        const isWeeklyComplete =
          d!.weeklyEntryLimit > 0 && weeklyEntries >= d!.weeklyEntryLimit;

        return isDailyComplete || isWeeklyComplete;
      });

      if (!isCharComplete) {
        return getCharacterById(char.id);
      }
    }
    return undefined;
  }, [
    isCurrentScheduleComplete,
    trackedCharacters,
    playingCharacter?.id,
    today,
    formattedDungeons,
  ]);

  const isAllDone = isCurrentScheduleComplete && !nextCharacter;

  if (!playingCharacter) {
    return (
      <div className="h-screen flex items-center justify-center text-center text-white">
        Could not find any playing character.
        <br />
        Make sure to have the game open and running.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="mb-10">
          <GameStatus
            character={playingCharacter}
            dungeon={currentlyPlayingDungeon}
            nextCharacter={nextCharacter}
            isAllDone={isAllDone}
          />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-bold text-white">
              Today's Schedule{" "}
              <span className="text-light-blue text-sm">({today})</span>
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
              todayDungeons.map((dungeon) => {
                const dailyEntries =
                  dungeon.charactersDailyEntries.find(
                    (entry) => entry.character_id === playingCharacter.id
                  )?.entries_count || 0;

                const weeklyEntries =
                  dungeon.charactersWeeklyEntries.find(
                    (entry) => entry.character_id === playingCharacter.id
                  )?.entries_count || 0;

                const isDailyComplete =
                  dungeon.dailyEntryLimit > 0 &&
                  dailyEntries >= dungeon.dailyEntryLimit;

                const isWeeklyComplete =
                  dungeon.weeklyEntryLimit > 0 &&
                  weeklyEntries >= dungeon.weeklyEntryLimit;

                const isComplete = isDailyComplete || isWeeklyComplete;

                let progressText = "";
                if (dungeon.dailyEntryLimit > 0) {
                  progressText = `${dailyEntries}/${dungeon.dailyEntryLimit}`;
                } else if (dungeon.weeklyEntryLimit > 0) {
                  progressText = `${weeklyEntries}/${dungeon.weeklyEntryLimit}`;
                }

                return (
                  <TodayScheduleCard
                    key={dungeon.id}
                    dungeon={dungeon}
                    playingCharacterId={playingCharacter.id}
                    isComplete={isComplete}
                    progressText={progressText}
                  />
                );
              })
            ) : (
              <div className="text-gray-400 text-sm italic py-4">
                No dungeons scheduled for today.
              </div>
            )}
          </div>
        </div>

        {heroDungeons.length > 0 && (
          <div>
            <p className="mb-4 text-light-blue">Hero Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={heroDungeons}
            />
          </div>
        )}

        {voidRaidDungeons.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-light-blue">Void Raid Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={voidRaidDungeons}
            />
          </div>
        )}

        {anotherWorldDungeons.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-light-blue">Another World Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={anotherWorldDungeons}
            />
          </div>
        )}

        {eventDungeons.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-light-blue">Event Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={eventDungeons}
            />
          </div>
        )}
      </div>

      {isScheduleBuilderOpen &&
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
                      [playingCharacter.id]: currentTrackedChar?.schedule || {},
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
