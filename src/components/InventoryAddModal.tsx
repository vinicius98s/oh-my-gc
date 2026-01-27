import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataContext } from "../DataContext";
import { Character } from "../utils/characters";
import {
  Item,
  getItems,
  addItemToInventory,
  getInventoryImage,
} from "../utils/inventory";
import { cn } from "../utils/lib";
import Modal from "./Modal";

type InventoryAddModalProps = {
  character: Character | null;
  onClose: () => void;
};

export default function InventoryAddModal({
  character,
  onClose,
}: InventoryAddModalProps) {
  const { url } = useDataContext();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => getItems(url!),
    enabled: !!url,
  });

  const handleSubmit = async () => {
    if (!url || !selectedItemId) return;
    setIsSubmitting(true);

    try {
      await addItemToInventory(url, {
        characterId: character?.id || null,
        itemId: selectedItemId,
        quantity,
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onClose();
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleItemSelect = (itemId: number) => {
    setSelectedItemId(itemId);
    setStep(2);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={step === 1 ? "Select Item" : "Set Quantity"}
    >
      <div className="flex flex-col gap-6">
        {step === 1 ? (
          <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item.id)}
                title={item.name}
                className={cn(
                  "relative p-3 min-h-[100px] w-full rounded-xl border-2 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700",
                  selectedItemId === item.id
                    ? "border-blue ring-2 ring-blue/30 bg-blue/5"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-white/10",
                )}
              >
                <img
                  src={getInventoryImage(item.id)}
                  alt={item.name}
                  className="h-10 w-10 object-contain transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                />
                <span className="text-[10px] text-white font-bold text-center leading-tight">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-gray-900 rounded-lg border border-white/5">
                <img
                  src={getInventoryImage(selectedItemId!)}
                  alt={selectedItem?.name}
                  className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-tight">
                  {selectedItem?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                  {character ? character.displayName : "Warehouse"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider text-center">
                Quantity
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-white/5 text-white transition-colors group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
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
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-24 h-12 bg-gray-950 border border-white/10 rounded-xl px-2 text-center font-bold text-xl text-white focus:outline-none focus:border-blue transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-white/5 text-white transition-colors group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
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

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue/20"
              >
                {isSubmitting ? "Adding..." : "Add Item"}
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full h-10 text-gray-500 hover:text-white text-sm font-medium transition-colors"
              >
                Back to Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
