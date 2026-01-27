import { useState } from "react";
import { InventoryItem, getInventoryImage } from "../utils/inventory";
import { cn } from "../utils/lib";
import { useDataContext } from "../DataContext";
import { getCharacterById, Character } from "../utils/characters";
import InventoryEditModal from "./InventoryEditModal";

type InventoryCardProps = {
  item: InventoryItem;
  totalQuantity: number;
  stacks: InventoryItem[];
};

export default function InventoryCard({
  item,
  totalQuantity,
  stacks,
}: InventoryCardProps) {
  const { characters } = useDataContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStack, setSelectedStack] = useState<{
    stack: InventoryItem;
    character: Character | null;
  } | null>(null);

  const imageUrl = getInventoryImage(item.itemId);

  return (
    <>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group relative bg-gray-900/40 border border-white/5 rounded-xl p-4 transition-all duration-500 hover:border-blue/30 cursor-pointer flex flex-col items-center gap-3 overflow-hidden",
          isExpanded
            ? "ring-2 ring-blue/30 bg-gray-900/80 z-20 scale-[1.02]"
            : "hover:bg-gray-900/60"
        )}
      >
        {/* Background Glow */}
        <div
          className={cn(
            "absolute inset-0 bg-blue/5 transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        />

        {/* Item Image Container */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue/20 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.112L3.75 7.5m6 4.5h3.75m-9.375-3h15.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125z"
                />
              </svg>
            </div>
          )}

          {/* Total Quantity Badge */}
          <div className="absolute -bottom-1 -right-1 bg-blue px-2 py-0.5 rounded-lg text-xs font-bold text-white shadow-lg border border-white/10 z-10">
            {totalQuantity}
          </div>
        </div>

        {/* Item Info */}
        <div className="flex flex-col items-center text-center gap-1 z-10 w-full mb-1">
          <h3 className="text-sm font-semibold text-gray-100 leading-snug">
            {item.name}
          </h3>
        </div>

        {/* Expandable Breakdown */}
        <div
          className={cn(
            "w-full overflow-hidden transition-all duration-500 ease-in-out z-10",
            isExpanded ? "max-h-[200px] opacity-100 mt-2" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-2 border-t border-white/10 space-y-2">
            {stacks.map((stack, idx) => {
              const ownerIds = stack.owners.split(",");
              return ownerIds.map((ownerId, oIdx) => {
                const isShared = ownerId === "Shared";
                const character = !isShared
                  ? getCharacterById(ownerId, characters)
                  : null;

                return (
                  <div
                    key={`${idx}-${oIdx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStack({ stack, character });
                    }}
                    className="flex items-center justify-between text-[11px] bg-white/5 rounded-lg px-2 py-1.5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    style={
                      character
                        ? { borderColor: `${character.colorTheme.to}20` }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {isShared ? (
                        <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center border border-green-400/30">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="w-3 h-3 text-green-400"
                          >
                            <path d="M20 7l-8-4-8 4v10l8 4 8-4V7zM12 21v-8M12 13l8-4M12 13l-8-4" />
                          </svg>
                        </div>
                      ) : character ? (
                        <img
                          src={character.image}
                          className="w-5 h-5 rounded-full border border-white/10 object-top object-cover bg-gray-800"
                          alt=""
                        />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-500" />
                      )}

                      <span
                        className={cn(
                          "truncate font-medium",
                          isShared
                            ? "text-green-400"
                            : character
                              ? "text-white"
                              : "text-gray-400"
                        )}
                      >
                        {isShared
                          ? "Warehouse"
                          : character?.displayName || "Unknown"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-bold tracking-tight",
                        isShared ? "text-green-400" : "text-blue"
                      )}
                    >
                      x{stack.quantity}
                    </span>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* Indicator */}
        {!isExpanded && stacks.length > 1 && (
          <div className="text-[10px] text-gray-400 mt-[-4px]">
            Click to see {stacks.length} sources
          </div>
        )}
      </div>

      {selectedStack && (
        <InventoryEditModal
          stack={selectedStack.stack}
          character={selectedStack.character}
          onClose={() => setSelectedStack(null)}
        />
      )}
    </>
  );
}
