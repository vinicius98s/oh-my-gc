import { useMemo } from "react";

import { useDataContext } from "../DataContext";
import { InventoryItem } from "../utils/inventory";
import CharacterInventoryCard from "../components/CharacterInventoryCard";
import { Character } from "../utils/characters";
import { cn } from "../utils/lib";

export default function Inventory() {
  const { inventory, characters, playingCharacter } = useDataContext();

  // Group by character
  const characterGroups = useMemo(() => {
    if (!inventory || !characters) return [];

    const groupsMap = new Map<
      string,
      { character: Character | null; items: InventoryItem[] }
    >();

    inventory.forEach((item) => {
      const ownerIds = item.owners.split(",");
      ownerIds.forEach((ownerId) => {
        const key = ownerId;
        if (!groupsMap.has(key)) {
          const character =
            ownerId === "Shared"
              ? null
              : characters.find((c) => c.id === parseInt(ownerId)) || null;
          groupsMap.set(key, { character, items: [] });
        }

        // Find if this item already exists for this character (could happen if different stacks)
        // But for display we might want all stacks
        groupsMap.get(key)!.items.push(item);
      });
    });

    // Convert map to array and filter out characters without items
    return Array.from(groupsMap.values())
      .filter((group) => group.items.length > 0)
      .sort((a, b) => {
        // Playing character first
        if (a.character?.id === playingCharacter?.id) return -1;
        if (b.character?.id === playingCharacter?.id) return 1;
        // Shared second
        if (a.character === null) return -1;
        if (b.character === null) return 1;
        // Then by name
        return (a.character?.displayName || "").localeCompare(
          b.character?.displayName || ""
        );
      });
  }, [inventory, characters, playingCharacter?.id]);

  const playingCharGroup = characterGroups.find(
    (g) => g.character?.id === playingCharacter?.id
  );
  const warehouseGroup = characterGroups.find((g) => g.character === null);
  const otherGroups = characterGroups.filter(
    (g) => g.character?.id !== playingCharacter?.id && g.character !== null
  );
  const warehouseIsMain = playingCharGroup.character === null;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <main className="flex-1 p-6 space-y-6">
        {characterGroups.length > 0 ? (
          <>
            <div className="grid grid-cols-5 gap-6">
              {playingCharGroup && (
                <div
                  className={cn(warehouseIsMain ? "col-span-5" : "col-span-3")}
                >
                  <CharacterInventoryCard
                    character={playingCharGroup.character}
                    items={playingCharGroup.items}
                    isBanner
                  />
                </div>
              )}
              {warehouseGroup && !warehouseIsMain && (
                <div className={playingCharGroup ? "col-span-2" : "col-span-5"}>
                  <CharacterInventoryCard
                    character={warehouseGroup.character}
                    items={warehouseGroup.items}
                  />
                </div>
              )}
            </div>

            {otherGroups.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {otherGroups.map((group, idx) => (
                  <CharacterInventoryCard
                    key={group.character?.id || `char-${idx}`}
                    character={group.character}
                    items={group.items}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-16 h-16 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.112L3.75 7.5m6 4.5h3.75m-9.375-3h15.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125z"
              />
            </svg>
            <p className="text-xl font-medium">No items found</p>
          </div>
        )}
      </main>
    </div>
  );
}
