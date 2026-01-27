import earringsFragment from "../assets/items/dimension-earrings-fragment.png";
import piercingFragment from "../assets/items/dimension-piercing-fragment.png";
import voidInvasionFragment from "../assets/items/void-invasion.png";
import voidTaintFragment from "../assets/items/void-taint.png";
import voidNightmareFragment from "../assets/items/void-nightmare.png";
import voidInvasionPieceFragment from "../assets/items/piece-void-invasion.png";
import voidTaintPieceFragment from "../assets/items/piece-void-taint.png";
import voidNightmarePieceFragment from "../assets/items/piece-void-nightmare.png";

export type InventoryItem = {
  itemId: number;
  name: string;
  quantity: number;
  stackId: number;
  owners: string;
  isSharable: boolean;
};

export type Item = {
  id: number;
  name: string;
  isSharable: boolean;
};

export type InventoryResponse = {
  data: InventoryItem[];
};

export async function getInventory(baseUrl: string): Promise<InventoryItem[]> {
  const response = await fetch(`${baseUrl}/inventory`);
  const { data } = await response.json();
  return data;
}

export async function updateInventoryItem(
  baseUrl: string,
  payload: {
    stackId: number;
    quantity?: number;
    characterId?: number | null;
  }
): Promise<{ data: string }> {
  const response = await fetch(`${baseUrl}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function getItems(baseUrl: string): Promise<Item[]> {
  const response = await fetch(`${baseUrl}/items`);
  const { data } = await response.json();
  return data;
}

export async function addItemToInventory(
  baseUrl: string,
  payload: {
    characterId: number | null;
    itemId: number;
    quantity: number;
  }
): Promise<{ data: string }> {
  const response = await fetch(`${baseUrl}/inventory/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export function getInventoryImage(itemId: number): string {
  const imageMap: Record<number, string> = {
    1: earringsFragment,
    2: piercingFragment,
    3: voidInvasionFragment,
    4: voidInvasionPieceFragment,
    5: voidTaintFragment,
    6: voidTaintPieceFragment,
    7: voidNightmareFragment,
    8: voidNightmarePieceFragment,
  };

  return imageMap[itemId] || "";
}
