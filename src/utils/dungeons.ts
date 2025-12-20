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
  entryLimit: number | null;
  entryPeriod: "daily" | "weekly" | null;
  resetDay: number | null;
  accentColor: string;
  charactersAvgCompletionTime: { character_id: number; avg_time: number | null }[];
  charactersWeeklyEntries: { entries_count: number; character_id: number }[];
  charactersDailyEntries: { entries_count: number; character_id: number }[];
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
  return dungeonsEntries.entries.filter(
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
  return dungeonsEntries.entries.filter(
    ({ dungeon_id, character_id, started_at }) =>
      dungeon_id === dungeonId &&
      character_id === characterId &&
      new Date(started_at + "Z").toDateString() === today,
  ).length;
}

export function formatDungeons(
  dungeons: DungeonsResponse,
  dungeonsEntries: DungeonsEntriesResponse,
) {
  return dungeons.map(
    ({
      id,
      name,
      type,
      display_name,
      entry_limit,
      entry_period,
      reset_day,
      accent_color,
    }) => {
      const dailyEntriesMap = new Map<number, number>();
      const today = new Date().toDateString();

      dungeonsEntries.entries.forEach((entry) => {
        if (
          entry.dungeon_id === id &&
          new Date(entry.started_at + "Z").toDateString() === today
        ) {
          dailyEntriesMap.set(
            entry.character_id,
            (dailyEntriesMap.get(entry.character_id) || 0) + 1
          );
        }
      });

      const charactersDailyEntries = Array.from(dailyEntriesMap.entries()).map(
        ([character_id, entries_count]) => ({
          character_id,
          entries_count,
        })
      );

      // Get weekly entries for this dungeon from aggregated data
      const charactersWeeklyEntries = dungeonsEntries.characters_entries
        .filter((entry) => entry.dungeon_id === id)
        .map(({ character_id, entries_count }) => ({
          character_id,
          entries_count,
        }));

      // Get avg completion time for this dungeon from aggregated data
      const charactersAvgCompletionTime = dungeonsEntries.characters_avg_completion_time
        .filter((entry) => entry.dungeon_id === id)
        .map(({ character_id, avg_time }) => ({
          character_id,
          avg_time,
        }));

      return {
        id,
        name,
        type,
        displayName: display_name,
        image: getDungeonImage(id),
        entryLimit: entry_limit,
        entryPeriod: entry_period as "daily" | "weekly" | null,
        resetDay: reset_day,
        accentColor: accent_color,
        charactersAvgCompletionTime: charactersAvgCompletionTime,
        charactersWeeklyEntries: charactersWeeklyEntries,
        charactersDailyEntries: charactersDailyEntries,
      };
    }
  );
}


export function formatDungeonAverageTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return "--";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export type DungeonsResponse = {
  id: number;
  name: string;
  display_name: string;
  type: DungeonTypes;
  entry_limit: number | null;
  entry_period: string | null;
  reset_day: number | null;
  accent_color: string;
}[];

export async function getDungeons(baseUrl: string) {
  const response = await fetch(`${baseUrl}/dungeons`);
  const { data } = (await response.json()) as { data: DungeonsResponse };
  return data;
}

export type DungeonEntry = {
  id: number;
  dungeon_id: number;
  character_id: number;
  started_at: string;
  finished_at: string;
};

export type CharacterEntriesAggregated = {
  dungeon_id: number;
  character_id: number;
  entries_count: number;
};

export type CharacterAvgCompletionTime = {
  dungeon_id: number;
  character_id: number;
  avg_time: number | null;
};

export type DungeonsEntriesResponse = {
  entries: DungeonEntry[];
  characters_entries: CharacterEntriesAggregated[];
  characters_avg_completion_time: CharacterAvgCompletionTime[];
};

export async function getDungeonsEntries(baseUrl: string) {
  const response = await fetch(`${baseUrl}/dungeons_entries`);
  const { data } = (await response.json()) as { data: DungeonsEntriesResponse };
  return data;
}
