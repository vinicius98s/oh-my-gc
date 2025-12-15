import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";

import NumberInput from "./NumberInput";
import AllCharactersEntries from "./AllCharactersEntries";
import {
  FormattedDungeon,
  getCharacterDungeonEntries,
  getCharacterDailyEntries,
} from "../utils/dungeons";
import { useDataContext } from "../DataContext";
import { cn } from "../utils/lib";

type DungeonCardProps = {
  dungeon: FormattedDungeon;
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
    null,
  );
  const [editedValue, setEditedValue] = useState<number | null>(null);

  const weeklyEntries = getCharacterDungeonEntries(
    dungeonsEntries,
    dungeon.id,
    playingCharacterId,
  );
  const dailyEntries = getCharacterDailyEntries(
    dungeonsEntries,
    dungeon.id,
    playingCharacterId,
  );

  const handleSave = () => {
    if (editedValue !== null && editingMode) {
      onEdit(dungeon.id, editedValue, editingMode);
      setEditingMode(null);
      setEditedValue(null);
    }
  };

  const showWeeklyProgress = !!dungeon.weeklyEntryLimit;
  const showDailyProgress =
    !!dungeon.dailyEntryLimit && !dungeon.weeklyEntryLimit;

  return (
    <div
      className={cn(
        "border-1 border-white/10 rounded-md p-4 bg-[#3D4247] w-full flex flex-col text-center",
        dungeon.name === playingDungeon
          ? "animate-playing outline-2 outline-white/20"
          : "outline-transparent",
      )}
    >
      <img
        src={dungeon.image}
        className="rounded-sm size-12 self-center mb-2"
      />
      <p className="text-sm">{dungeon.displayName}</p>

      <div className="flex flex-col gap-2 mt-auto pt-2">
        {dungeon.weeklyEntryLimit !== null && (
          <div className="flex items-center justify-between h-9 text-sm">
            <span className="text-gray-300 mr-2">Weekly:</span>
            {editingMode === "weekly" ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingMode(null)}
                  className="p-1 hover:text-white"
                >
                  <X size={14} />
                </button>
                <NumberInput
                  defaultValue={weeklyEntries}
                  min={0}
                  max={dungeon.weeklyEntryLimit}
                  onChangeValue={setEditedValue}
                  className="w-12 h-7 text-center"
                />
                <button
                  onClick={handleSave}
                  disabled={
                    editedValue === weeklyEntries || editedValue === null
                  }
                  className="p-1 hover:text-green-400 disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditingMode("weekly");
                  setEditedValue(weeklyEntries);
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
              >
                <span>
                  {weeklyEntries}/{dungeon.weeklyEntryLimit}
                </span>
                <Pencil size={12} className="opacity-50" />
              </div>
            )}
          </div>
        )}

        {dungeon.dailyEntryLimit !== null && (
          <div className="flex items-center justify-between h-9 text-sm">
            <span className="text-gray-300 mr-2">Daily:</span>
            {editingMode === "daily" ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingMode(null)}
                  className="p-1 hover:text-white"
                >
                  <X size={14} />
                </button>
                <NumberInput
                  defaultValue={dailyEntries}
                  min={0}
                  max={dungeon.dailyEntryLimit}
                  onChangeValue={setEditedValue}
                  className="w-12 h-7 text-center"
                />
                <button
                  onClick={handleSave}
                  disabled={
                    editedValue === dailyEntries || editedValue === null
                  }
                  className="p-1 hover:text-green-400 disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditingMode("daily");
                  setEditedValue(dailyEntries);
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded"
              >
                <span>
                  {dailyEntries}/{dungeon.dailyEntryLimit}
                </span>
                <Pencil size={12} className="opacity-50" />
              </div>
            )}
          </div>
        )}
      </div>

      {showWeeklyProgress && (
        <AllCharactersEntries
          charactersEntries={dungeon.charactersWeeklyEntries}
          allCharactersEntries={dungeon.allCharactersEntries}
          totalCharactersEntries={dungeon.totalCharactersEntries}
          entryLimit={dungeon.weeklyEntryLimit}
        />
      )}

      {showDailyProgress && (
        <AllCharactersEntries
          charactersEntries={dungeon.charactersDailyEntries}
          allCharactersEntries={dungeon.allDailyCharactersEntries}
          totalCharactersEntries={dungeon.totalDailyCharactersEntries}
          entryLimit={dungeon.dailyEntryLimit}
        />
      )}
    </div>
  );
}
