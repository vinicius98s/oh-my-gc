import theCrucible from "../assets/dungeons/the-crucible.png";
import sanctumOfDestruction from "../assets/dungeons/sanctum-of-destruction.png";
import wizardsLabyrinth from "../assets/dungeons/wizards-labyrinth.png";
import berkas from "../assets/dungeons/berkas.png";
import towerOfDisappearance from "../assets/dungeons/tower-of-disappearance.png";
import landOfJudgment from "../assets/dungeons/land-of-judgment.png";
import infinityCloister from "../assets/dungeons/infinity-cloister.png";
import abyssalPath from "../assets/dungeons/abyssal-path.png";
import voidInvasion from "../assets/dungeons/void-invasion.png";
import voidTaint from "../assets/dungeons/void-taint.png";
import voidNightmare from "../assets/dungeons/void-nightmare.png";
import angryBoss from "../assets/dungeons/angry-boss.png";
import siegeOfTeroka from "../assets/dungeons/siege-of-teroka.png";
import templeOfTime from "../assets/dungeons/temple-of-time.png";
import kounat from "../assets/dungeons/kounat.png";
import chapelOfEternity from "../assets/dungeons/chapel-of-eternity.png";

type DungeonTypes = "hero-dungeon" | "void-raid-dungeon" | "event-dungeon" | "another-world";
export type Dungeon = {
  id: number;
  name: string;
  type: DungeonTypes;
  displayName: string;
  image: string;
  weeklyEntryLimit: number;
  dailyEntryLimit: number;
  charactersWeeklyEntries: { entries_count: number; character_id: number }[];
  charactersDailyEntries: { entries_count: number; character_id: number }[];
};

export type FormattedDungeon = Dungeon & {
  totalCharactersEntries: number;
  allCharactersEntries: number;
  totalDailyCharactersEntries: number;
  allDailyCharactersEntries: number;
};

function getDungeonImage(id: number) {
  return {
    1: theCrucible,
    2: sanctumOfDestruction,
    3: wizardsLabyrinth,
    4: berkas,
    5: towerOfDisappearance,
    6: landOfJudgment,
    7: infinityCloister,
    8: abyssalPath,
    9: angryBoss,
    10: voidInvasion,
    11: voidTaint,
    12: voidNightmare,
    13: siegeOfTeroka,
    14: templeOfTime,
    15: kounat,
    16: chapelOfEternity,
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

export function getCharacterDailyEntries(
  dungeonsEntries: DungeonsEntriesResponse,
  dungeonId: number,
  characterId: number,
) {
  const today = new Date().toDateString();
  return dungeonsEntries.filter(
    ({ dungeon_id, character_id, started_at }) =>
      dungeon_id === dungeonId &&
      character_id === characterId &&
      new Date(started_at + "Z").toDateString() === today,
  ).length;
}

export function formatDungeons(
  dungeons: DungeonsResponse,
  dungeonsEntries: DungeonsEntriesResponse,
  trackedCharactersCount: number,
) {
  return dungeons.map(
    ({
      id,
      name,
      type,
      display_name,
      weekly_entry_limit,
      daily_entry_limit,
      characters_entries,
    }) => {
      // Calculate daily entries map for all characters
      const dailyEntriesMap = new Map<number, number>();
      const today = new Date().toDateString();
      let allDailyCharactersEntries = 0;

      dungeonsEntries.forEach((entry) => {
        if (
          entry.dungeon_id === id &&
          new Date(entry.started_at + "Z").toDateString() === today
        ) {
          dailyEntriesMap.set(
            entry.character_id,
            (dailyEntriesMap.get(entry.character_id) || 0) + 1,
          );
          allDailyCharactersEntries++;
        }
      });

      const charactersDailyEntries = Array.from(dailyEntriesMap.entries()).map(
        ([character_id, entries_count]) => ({
          character_id,
          entries_count,
        }),
      );

      return {
        id,
        name,
        type,
        displayName: display_name,
        image: getDungeonImage(id),
        weeklyEntryLimit: weekly_entry_limit,
        dailyEntryLimit: daily_entry_limit,
        totalCharactersEntries:
          (weekly_entry_limit || 0) * trackedCharactersCount,
        allCharactersEntries: dungeonsEntries.filter(
          ({ dungeon_id }) => dungeon_id === id,
        ).length,
        totalDailyCharactersEntries:
          (daily_entry_limit || 0) * trackedCharactersCount,
        allDailyCharactersEntries: allDailyCharactersEntries,
        charactersWeeklyEntries: characters_entries, // From DB (Weekly)
        charactersDailyEntries: charactersDailyEntries, // Calculated (Daily)
      };
    },
  );
}

export type DungeonsResponse = {
  id: number;
  name: string;
  display_name: string;
  type: DungeonTypes;
  weekly_entry_limit: number;
  daily_entry_limit: number;
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
