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

  const sections = [
    {
      title: "Hero Dungeons",
      data: dungeons.filter((d) => d.type === "hero-dungeon"),
    },
    {
      title: "Void Raid Dungeons",
      data: dungeons.filter((d) => d.type === "void-raid-dungeon"),
    },
    {
      title: "Another World Dungeons",
      data: dungeons.filter((d) => d.type === "another-world"),
    },
    {
      title: "Event Dungeons",
      data: dungeons.filter((d) => d.type === "event-dungeon"),
    },
  ].filter((section) => section.data.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={day}>
      <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 font-semibold text-light-blue">
              {section.title}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {section.data.map((dungeon) => (
                <button
                  key={dungeon.id}
                  onClick={() => toggleDungeon(dungeon.id)}
                  title={dungeon.displayName}
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-md border-2 transition-all cursor-pointer group",
                    selected.includes(dungeon.id)
                      ? "border-blue ring-2 ring-blue/30"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-white/20",
                  )}
                >
                  <img
                    src={dungeon.image}
                    alt={dungeon.displayName}
                    className="h-full w-full object-cover"
                  />
                  {selected.includes(dungeon.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue/20 backdrop-blur-[1px]">
                      <div className="rounded-full bg-blue p-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 text-white"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <Button onClick={handleSave} className="w-full justify-center sticky bottom-0">
          Save
        </Button>
      </div>
    </Modal>
  );
}
