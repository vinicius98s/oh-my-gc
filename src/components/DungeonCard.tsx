import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";

import NumberInput from "./NumberInput";
import { Dungeon, formatDungeonAverageTime } from "../utils/dungeons";
import { useDataContext } from "../DataContext";
import { cn } from "../utils/lib";

type DungeonCardProps = {
  dungeon: Dungeon;
  onEdit: (dungeonId: number, value: number, mode: "weekly" | "daily") => void;
};

export default function DungeonCard({ dungeon, onEdit }: DungeonCardProps) {
  const { playingDungeon } = useDataContext();
  const [editingMode, setEditingMode] = useState<"weekly" | "daily" | null>(
    null
  );
  const [editedValue, setEditedValue] = useState<number | null>(null);

  const handleSave = () => {
    if (editedValue !== null && editingMode) {
      onEdit(dungeon.id, editedValue, editingMode);
      setEditingMode(null);
      setEditedValue(null);
    }
  };

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 overflow-hidden",
        dungeon.name === playingDungeon
          ? "animate-playing ring-2 ring-white/10"
          : "hover:shadow-xl"
      )}
      style={{
        backgroundColor: "rgba(34, 38, 42, 0.6)",
        backdropFilter: "blur(12px)",
        borderColor: `${dungeon.accentColor}33`,
        boxShadow:
          dungeon.name === playingDungeon
            ? `0 0 20px ${dungeon.accentColor}40`
            : "none",
      }}
    >
      <div
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: dungeon.accentColor }}
      />

      <div className="relative mb-3">
        <img
          src={dungeon.image}
          className={cn(
            "rounded-xl size-14 object-cover shadow-lg transition-transform duration-300 group-hover:scale-110",
            dungeon.name === playingDungeon && "animate-pulse"
          )}
          alt={dungeon.displayName}
          style={{
            border: `2px solid ${dungeon.accentColor}4D`,
          }}
        />
        {dungeon.name === playingDungeon && (
          <div className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
        )}
      </div>

      <h3 className="text-center text-sm font-bold text-white mb-4 tracking-tight drop-shadow-md">
        {dungeon.displayName}
      </h3>

      <div className="w-full flex flex-col gap-2.5 mt-auto">
        {dungeon.entryLimit !== null && dungeon.entryPeriod === "weekly" && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Weekly
            </span>
            {editingMode === "weekly" ? (
              <div className="flex items-center gap-1">
                <button
                  className="cursor-pointer text-white/60 hover:text-white transition-colors"
                  onClick={() => setEditingMode(null)}
                >
                  <X size={14} />
                </button>
                <div className="scale-90">
                  <NumberInput
                    defaultValue={dungeon.entriesCount}
                    min={0}
                    max={dungeon.entryLimit}
                    onChangeValue={setEditedValue}
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="text-white/60 hover:text-white cursor-pointer disabled:opacity-30 transition-colors"
                  disabled={
                    editedValue === dungeon.entriesCount || editedValue === null
                  }
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditingMode("weekly");
                  setEditedValue(dungeon.entriesCount);
                }}
                className="group/item flex items-center gap-1.5 cursor-pointer hover:text-white transition-all"
              >
                <Pencil
                  size={10}
                  className="opacity-0 group-hover/item:opacity-50 transition-opacity"
                />
                <span className="text-sm font-medium text-gray-300">
                  {dungeon.entriesCount}
                  <small className="opacity-50 ml-0.5">
                    / {dungeon.entryLimit}
                  </small>
                </span>
              </div>
            )}
          </div>
        )}

        {dungeon.entryLimit !== null && dungeon.entryPeriod === "daily" && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Daily
            </span>
            {editingMode === "daily" ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingMode(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
                <NumberInput
                  defaultValue={dungeon.entriesCount}
                  min={0}
                  max={dungeon.entryLimit}
                  onChangeValue={setEditedValue}
                />
                <button
                  onClick={handleSave}
                  disabled={
                    editedValue === dungeon.entriesCount || editedValue === null
                  }
                  className="text-white/60 hover:text-white cursor-pointer disabled:opacity-30 transition-colors"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditingMode("daily");
                  setEditedValue(dungeon.entriesCount);
                }}
                className="group/item flex items-center gap-1.5 cursor-pointer hover:text-white transition-all"
              >
                <Pencil
                  size={10}
                  className="opacity-0 group-hover/item:opacity-50 transition-opacity"
                />
                <span className="text-sm font-medium text-gray-300">
                  {dungeon.entriesCount}
                  <small className="opacity-50 ml-0.5">
                    / {dungeon.entryLimit}
                  </small>
                </span>
              </div>
            )}
          </div>
        )}

        {dungeon.entryLimit === null && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Entries
            </span>
            <span className="text-xs font-medium text-gray-300">
              {dungeon.entriesCount}
            </span>
          </div>
        )}

        <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Avg Time
          </span>
          <span className="text-xs font-semibold text-white">
            {formatDungeonAverageTime(dungeon.avgTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
