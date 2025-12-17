import { useState, useMemo } from "react";

import DungeonSelectionModal from "./DungeonSelectionModal";
import Button from "./Button";
import { getCharacterById } from "../utils/characters";
import { useDataContext } from "../DataContext";
import { formatDungeons } from "../utils/dungeons";

type SchedulerBuilderProps = {
  selectedCharacterIds: number[];
  initialSchedules?: ScheduleState;
  onConfirm: (schedules: ScheduleState) => void;
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Type: CharacterID -> DayName -> DungeonIDs
export type ScheduleState = Record<number, Record<string, number[]>>;

export default function SchedulerBuilder({
  selectedCharacterIds,
  initialSchedules,
  onConfirm,
}: SchedulerBuilderProps) {
  const { dungeons, dungeonsEntries, trackedCharacters } = useDataContext();

  const formattedDungeons = useMemo(() => {
    return formatDungeons(dungeons, dungeonsEntries, trackedCharacters.length);
  }, [dungeons, dungeonsEntries, trackedCharacters]);

  // Select first character by default if available
  const [selectedBuilderCharacterId, setSelectedBuilderCharacterId] = useState<
    number | null
  >(selectedCharacterIds.length > 0 ? selectedCharacterIds[0] : null);

  const [schedules, setSchedules] = useState<ScheduleState>(
    initialSchedules || {},
  );
  const [openModalDay, setOpenModalDay] = useState<string | null>(null);

  // Memoized current character for easy access
  const currentCharacter = useMemo(
    () =>
      selectedBuilderCharacterId
        ? getCharacterById(selectedBuilderCharacterId)
        : null,
    [selectedBuilderCharacterId],
  );

  const handleSaveDungeons = (dungeonIds: number[]) => {
    if (!selectedBuilderCharacterId || !openModalDay) return;

    setSchedules((prev) => ({
      ...prev,
      [selectedBuilderCharacterId]: {
        ...(prev[selectedBuilderCharacterId] || {}),
        [openModalDay]: dungeonIds,
      },
    }));
  };

  const isScheduleEmptyForCharacter = (charId: number) => {
    const characterSchedule = schedules[charId];
    if (!characterSchedule) {
      return true;
    }
    return Object.values(characterSchedule).every(
      (dayDungeons) => dayDungeons.length === 0,
    );
  };

  const getDungeonsForDay = (charId: number, day: string) => {
    return schedules[charId]?.[day] || [];
  };

  const currentIndex = selectedCharacterIds.indexOf(
    selectedBuilderCharacterId!,
  );
  const isLastCharacter = currentIndex === selectedCharacterIds.length - 1;

  const handleConfirm = () => {
    if (!isLastCharacter) {
      setSelectedBuilderCharacterId(selectedCharacterIds[currentIndex + 1]);
    } else {
      onConfirm(schedules);
    }
  };

  return (
    <div className="flex h-full w-full max-w-6xl mx-auto overflow-hidden gap-6 pb-4">
      {selectedCharacterIds.length > 1 ? (
        <div className="w-24 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 min-h-0 border-r border-white/10">
          {selectedCharacterIds.map((charId) => {
            const character = getCharacterById(charId);
            if (!character) return null;
            const isSelected = charId === selectedBuilderCharacterId;

            return (
              <button
                key={charId}
                onClick={() => setSelectedBuilderCharacterId(charId)}
                title={character.displayName}
                className={`group flex items-center justify-center rounded-md cursor-pointer focus:outline-none`}
              >
                <img
                  src={character.image}
                  alt={character.displayName}
                  className={`${isSelected ? "border-blue opacity-100" : "border-transparent opacity-30"} border-2 rounded-md group-focus:border-white`}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex-1 flex flex-col min-h-0">
        {currentCharacter ? (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-light-gray pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={currentCharacter.image}
                  alt={currentCharacter.displayName}
                  className="h-12 w-12 rounded-full"
                />
                <h2 className="text-xl font-bold text-white">
                  {currentCharacter.displayName}
                </h2>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={isScheduleEmptyForCharacter(currentCharacter.id)}
              >
                {isLastCharacter ? "Confirm" : "Next Character"}
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-sm font-semibold text-light-blue">
                    {day}
                  </span>
                  <button
                    onClick={() => setOpenModalDay(day)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const dungeonIds = getDungeonsForDay(
                    selectedBuilderCharacterId!,
                    day,
                  );
                  return (
                    <div
                      key={day}
                      className="rounded-md bg-gray/30 border border-white/5 p-2 min-h-[180px] flex flex-col gap-1"
                    >
                      {dungeonIds.map((dungeonId) => {
                        const dungeon = formattedDungeons.find(
                          (d) => d.id === dungeonId,
                        );
                        if (!dungeon) return null;

                        return (
                          <div
                            key={dungeonId}
                            className="flex items-center justify-center gap-2 rounded bg-blue/20 p-1 text-blue-200 border border-blue/30"
                            title={dungeon.displayName || dungeon.name}
                          >
                            <img
                              src={dungeon.image}
                              alt={dungeon.name}
                              className="rounded"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Select a character to build their schedule
          </div>
        )}
      </div>

      <DungeonSelectionModal
        isOpen={!!openModalDay && !!selectedBuilderCharacterId}
        onClose={() => setOpenModalDay(null)}
        day={openModalDay || ""}
        initialSelectedDungeons={
          (selectedBuilderCharacterId &&
            openModalDay &&
            schedules[selectedBuilderCharacterId]?.[openModalDay]) ||
          []
        }
        onSave={handleSaveDungeons}
        dungeons={formattedDungeons}
      />
    </div>
  );
}
