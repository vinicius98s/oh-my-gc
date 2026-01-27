import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Character } from "../utils/characters";
import {
  InventoryItem,
  updateInventoryItem,
  getInventoryImage,
} from "../utils/inventory";
import { useDataContext } from "../DataContext";

type InventoryEditModalProps = {
  stack: InventoryItem;
  character: Character | null;
  onClose: () => void;
};

export default function InventoryEditModal({
  stack,
  character,
  onClose,
}: InventoryEditModalProps) {
  const { url } = useDataContext();
  const [quantity, setQuantity] = useState(stack.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const isShared = !character;

  useEffect(() => {
    setQuantity(stack.quantity);
  }, [stack]);

  const handleUpdate = async (newCharId?: number | null) => {
    if (!url) return;
    setIsUpdating(true);

    const payload = {
      stackId: stack.stackId,
      quantity: quantity,
      characterId: newCharId !== undefined ? newCharId : undefined,
    };

    try {
      await updateInventoryItem(url, payload);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onClose();
    } catch (error) {
      console.error("Failed to update inventory:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  console.log(stack);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Update Item</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {/* Character Info */}
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {isShared ? (
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
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
                ) : character ? (
                  <img
                    src={character.image}
                    className="w-12 h-12 rounded-full border border-white/10 object-top object-cover bg-gray-800"
                    alt=""
                  />
                ) : null}
              </div>
              <h3 className="text-lg font-bold text-white">
                {isShared ? "Warehouse" : character?.displayName}
              </h3>
            </div>

            <div className="border-t border-white/10" />

            {/* Item Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <img
                  src={getInventoryImage(stack.itemId)}
                  alt=""
                  className="w-14 h-14 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <p className="text-md font-semibold text-gray-200 leading-tight">
                  {stack.name}
                </p>

                {!isShared && (
                  <div className="flex">
                    <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      Character Bound
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Quantity
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-white/5 text-white transition-colors shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12h-15"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-24 h-10 bg-gray-950 border border-white/10 rounded-lg px-2 text-center font-bold text-lg text-white focus:outline-none focus:border-blue/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-white/5 text-white transition-colors shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => handleUpdate()}
                disabled={isUpdating}
                className="w-full h-12 bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue/20"
              >
                {isUpdating ? "Updating..." : "Save Changes"}
              </button>

              {!isShared && stack.isSharable && (
                <button
                  onClick={() => handleUpdate(null)}
                  disabled={isUpdating}
                  className="w-full h-12 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold rounded-xl border border-green-500/20 transition-all"
                >
                  Move to Warehouse
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full h-10 text-gray-500 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
