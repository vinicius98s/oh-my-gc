import theCrucible from "../assets/dungeons/the-crucible.png";
import sanctumOfDestruction from "../assets/dungeons/sanctum-of-destruction.png";
import wizardsLabyrinth from "../assets/dungeons/wizards-labyrinth.png";

export type Dungeon = {
  id: number;
  name: string;
  displayName: string;
  image: string;
  weeklyEntryLimit: number;
};

function getDungeonImage(id: number) {
  return {
    1: theCrucible,
    2: sanctumOfDestruction,
    3: wizardsLabyrinth,
  }[id];
}

export function getDungeonDisplayName(id: number | string) {
  if (typeof id === "string") {
    return {
      "the-crucible": "The Crucible",
      "sanctum-of-destruction": "Sanctum of Destruction",
      "wizards-labyrinth": "Wizard's Labyrinth",
    }[id];
  }

  return {
    1: "The Crucible",
    2: "Sanctum of Destruction",
    3: "Wizard's Labyrinth",
  }[id];
}

export function getCharacterDungeonEntries(
  dungeonsEntries: DungeonsEntriesResponse,
  dungeonId: number,
  characterId: number,
) {
  return dungeonsEntries.filter(
    ({ dungeon_id, character_id }) =>
      dungeon_id === dungeonId && character_id === characterId,
  ).length;
}

export function formatDungeons(
  dungeons: DungeonsResponse,
  dungeonsEntries: DungeonsEntriesResponse,
  trackedCharactersCount: number,
) {
  return dungeons.map(({ id, name, weekly_entry_limit, characters_entries }) => ({
    id,
    name,
    displayName: getDungeonDisplayName(id),
    image: getDungeonImage(id),
    weeklyEntryLimit: weekly_entry_limit,
    totalCharactersEntries: weekly_entry_limit * trackedCharactersCount,
    charactersEntries: characters_entries,
    allCharactersEntries: dungeonsEntries.filter(
      ({ dungeon_id }) => dungeon_id === id,
    ).length,
  }));
}

export type DungeonsResponse = {
  id: number;
  name: string;
  weekly_entry_limit: number;
  characters_entries: {
    entries_count: number;
    character_id: number;
  }[];
}[];

export async function getDungeons(baseUrl: string) {
  const response = await fetch(`${baseUrl}/dungeons`);
  const { data } = (await response.json()) as { data: DungeonsResponse };
  return data;
}

export type DungeonsEntriesResponse = {
  id: number;
  dungeon_id: number;
  character_id: number;
  started_at: string;
  finished_at: string;
}[];

export async function getDungeonsEntries(baseUrl: string) {
  const response = await fetch(`${baseUrl}/dungeons_entries`);
  const { data } = (await response.json()) as { data: DungeonsEntriesResponse };
  return data;
}
