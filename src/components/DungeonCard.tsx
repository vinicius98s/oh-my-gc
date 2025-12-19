import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";

import NumberInput from "./NumberInput";
import {
  Dungeon,
  getCharacterDungeonEntries,
  getCharacterDailyEntries,
  formatDungeonAverageTime,
} from "../utils/dungeons";
import { useDataContext } from "../DataContext";
import { cn } from "../utils/lib";

type DungeonCardProps = {
  dungeon: Dungeon;
  playingCharacterId: number;
  onEdit: (dungeonId: number, value: number, mode: "weekly" | "daily") => void;
};

export default function DungeonCard({
  dungeon,
  playingCharacterId,
  onEdit,
}: DungeonCardProps) {
  const { dungeonsEntries, playingDungeon } = useDataContext();
  const [editingMode, setEditingMode] = useState<"weekly" | "daily" | null>(
    null
  );
  const [editedValue, setEditedValue] = useState<number | null>(null);

  const weeklyEntries = getCharacterDungeonEntries(
    dungeonsEntries,
    dungeon.id,
    playingCharacterId
  );
  const dailyEntries = getCharacterDailyEntries(
    dungeonsEntries,
    dungeon.id,
    playingCharacterId
  );

  const handleSave = () => {
    if (editedValue !== null && editingMode) {
      onEdit(dungeon.id, editedValue, editingMode);
      setEditingMode(null);
      setEditedValue(null);
    }
  };

  const avgCompletionTime = dungeon.charactersAvgCompletionTime.find(
    (entry) => entry.character_id === playingCharacterId
  )?.avg_time;
  if (dungeon.id === 9) {
    console.log(avgCompletionTime);
  }

  return (
    <div
      className={cn(
        "border-1 border-white/15 rounded-md p-4 bg-[#3D4247] w-full flex flex-col text-center text-white",
        dungeon.name === playingDungeon
          ? "animate-playing outline-2 outline-white/20"
          : "outline-transparent"
      )}
    >
      <img
        src={dungeon.image}
        className="rounded-sm size-13 self-center mb-2"
      />
      <p className="text-sm">{dungeon.displayName}</p>

      <div className="flex flex-col gap-2 mt-auto pt-2">
        {dungeon.weeklyEntryLimit !== null && (
          <div className="flex items-center justify-between text-sm">
            {editingMode === "weekly" ? (
              <div className="flex items-center ml-auto mr-auto gap-1">
                <button
                  className="cursor-pointer text-white p-1"
                  onClick={() => setEditingMode(null)}
                >
                  <X size={14} />
                </button>
                <NumberInput
                  defaultValue={weeklyEntries}
                  min={0}
                  max={dungeon.weeklyEntryLimit}
                  onChangeValue={setEditedValue}
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-white cursor-pointer disabled:opacity-50"
                  disabled={
                    editedValue === weeklyEntries || editedValue === null
                  }
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-gray-300 text-xs">Weekly:</span>
                <div
                  onClick={() => {
                    setEditingMode("weekly");
                    setEditedValue(weeklyEntries);
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
                >
                  <Pencil size={12} className="opacity-50" />
                  <span>
                    {weeklyEntries}/{dungeon.weeklyEntryLimit}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {dungeon.dailyEntryLimit !== null && (
          <div className="flex items-center justify-between text-sm">
            {editingMode === "daily" ? (
              <div className="flex items-center ml-auto mr-auto gap-1">
                <button
                  onClick={() => setEditingMode(null)}
                  className="p-1 cursor-pointer text-white"
                >
                  <X size={14} />
                </button>
                <NumberInput
                  defaultValue={dailyEntries}
                  min={0}
                  max={dungeon.dailyEntryLimit}
                  onChangeValue={setEditedValue}
                />
                <button
                  onClick={handleSave}
                  disabled={
                    editedValue === dailyEntries || editedValue === null
                  }
                  className="p-1 cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-gray-300 text-sm">Daily:</span>
                <div
                  onClick={() => {
                    setEditingMode("daily");
                    setEditedValue(dailyEntries);
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
                >
                  <Pencil size={12} className="opacity-50" />
                  <span>
                    {dailyEntries}/{dungeon.dailyEntryLimit}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {!dungeon.weeklyEntryLimit && !dungeon.dailyEntryLimit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 text-xs">Today's Entries:</span>
            <span className="px-2">
              {dungeon.charactersDailyEntries.find(
                (entry) => entry.character_id === playingCharacterId
              )?.entries_count || 0}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-300 text-xs">Avg Time:</span>
          <span className="px-2">
            {formatDungeonAverageTime(avgCompletionTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
