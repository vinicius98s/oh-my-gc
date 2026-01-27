import { useState } from "react";
import { InventoryItem, getInventoryImage } from "../utils/inventory";
import { cn } from "../utils/lib";
import { Character } from "../utils/characters";
import InventoryEditModal from "./InventoryEditModal";
import InventoryAddModal from "./InventoryAddModal";

type CharacterInventoryCardProps = {
  character: Character | null; // null for Shared/Warehouse
  items: InventoryItem[];
  isBanner?: boolean;
};

export default function CharacterInventoryCard({
  character,
  items,
  isBanner = false,
}: CharacterInventoryCardProps) {
  const [selectedStack, setSelectedStack] = useState<InventoryItem | null>(
    null,
  );
  const [isAddingItem, setIsAddingItem] = useState(false);

  const displayName = character?.displayName || "Warehouse";
  const charImage = character?.image;
  const colorTheme = character?.colorTheme || {
    from: "#3b82f6",
    to: "#2563eb",
  };

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-xl transition-all duration-500",
          isBanner ? "p-6" : "p-4 flex flex-col h-full",
        )}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-900/80 z-10" />
          {charImage && isBanner && (
            <img
              src={charImage}
              alt=""
              className="h-full w-full object-cover opacity-20 blur-xl absolute right-0 top-0 translate-x-1/4 scale-150"
            />
          )}
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div
            className={cn(
              "flex items-center gap-4 mb-4",
              isBanner ? "mb-6" : "mb-4",
            )}
          >
            <div className="relative shrink-0">
              <div
                className="absolute -inset-1 rounded-full opacity-75 blur transition duration-500"
                style={{
                  background: `linear-gradient(to right, ${colorTheme.from}, ${colorTheme.to})`,
                }}
              />
              {charImage ? (
                <img
                  src={charImage}
                  alt={displayName}
                  className="relative h-12 w-12 rounded-full border-2 bg-gray-800 object-cover shadow-xl"
                  style={{ borderColor: colorTheme.from }}
                />
              ) : (
                <div className="relative h-12 w-12 rounded-full border-2 border-green-500 bg-gray-800 flex items-center justify-center shadow-xl">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-6 h-6 text-green-400"
                  >
                    <path d="M20 7l-8-4-8 4v10l8 4 8-4V7zM12 21v-8M12 13l8-4M12 13l-8-4" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              {character && (
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {isBanner ? "Currently Active" : "Character"}
                </p>
              )}
              <h3
                className={cn(
                  "font-bold text-white",
                  isBanner ? "text-xl" : "text-md",
                )}
              >
                {displayName}
              </h3>
            </div>

            {/* Add Button */}
            <button
              onClick={() => setIsAddingItem(true)}
              className="ml-auto p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all group shrink-0"
              title="Add Item"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 transition-transform group-hover:rotate-90"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          </div>

          {/* Items Container */}
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <button
                key={item.stackId}
                onClick={() => setSelectedStack(item)}
                className="cursor-pointer group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 w-full"
              >
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <img
                    src={getInventoryImage(item.itemId)}
                    alt={item.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-blue px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-lg border border-white/10 z-10">
                    {item.quantity}
                  </div>
                </div>
                <span className="text-xs text-white text-center line-clamp-2 leading-tight transition-colors overflow-hidden">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedStack && (
        <InventoryEditModal
          stack={selectedStack}
          character={character}
          onClose={() => setSelectedStack(null)}
        />
      )}

      {isAddingItem && (
        <InventoryAddModal
          character={character}
          onClose={() => setIsAddingItem(false)}
        />
      )}
    </>
  );
}
