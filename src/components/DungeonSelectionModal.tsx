import { useState, useEffect } from "react";

import Modal from "./Modal";
import Button from "./Button";
import { cn } from "../utils/lib";
import { Dungeon } from "../utils/dungeons";

type DungeonSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  day: string;
  initialSelectedDungeons: number[];
  onSave: (dungeons: number[]) => void;
  dungeons: Dungeon[];
};

export default function DungeonSelectionModal({
  isOpen,
  onClose,
  day,
  initialSelectedDungeons,
  onSave,
  dungeons,
}: DungeonSelectionModalProps) {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelected(initialSelectedDungeons);
    }
  }, [isOpen, initialSelectedDungeons]);

  const toggleDungeon = (dungeonId: number) => {
    setSelected((prev) =>
      prev.includes(dungeonId)
        ? prev.filter((d) => d !== dungeonId)
        : [...prev, dungeonId],
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const heroDungeons = dungeons.filter((d) => d.type === "hero-dungeon");
  const voidRaidDungeons = dungeons.filter(
    (d) => d.type === "void-raid-dungeon",
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={day}>
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 font-semibold text-light-blue">Hero Dungeons</h3>
          <div className="flex flex-wrap gap-2">
            {heroDungeons.map((dungeon) => (
              <button
                key={dungeon.id}
                onClick={() => toggleDungeon(dungeon.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  selected.includes(dungeon.id)
                    ? "border-blue bg-blue text-white"
                    : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500",
                )}
              >
                {dungeon.displayName}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-light-blue">
            Void Raid Dungeons
          </h3>
          <div className="flex flex-wrap gap-2">
            {voidRaidDungeons.map((dungeon) => (
              <button
                key={dungeon.id}
                onClick={() => toggleDungeon(dungeon.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  selected.includes(dungeon.id)
                    ? "border-blue bg-blue text-white"
                    : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500",
                )}
              >
                {dungeon.displayName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button onClick={handleSave} className="w-full justify-center">
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
