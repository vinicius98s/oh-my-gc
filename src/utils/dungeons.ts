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

export type DungeonType =
  | "hero-dungeon"
  | "void-raid-dungeon"
  | "event-dungeon"
  | "another-world";

export type Dungeon = {
  id: number;
  name: string;
  type: DungeonType;
  displayName: string;
  image: string;
  entryLimit: number | null;
  entryPeriod: "daily" | "weekly" | null;
  resetDay: number | null;
  accentColor: string;
  entriesCount: number;
  avgTime: number | null;
};

export type DungeonsResponse = {
  id: number;
  name: string;
  display_name: string;
  type: DungeonType;
  entry_limit: number | null;
  entry_period: string | null;
  reset_day: number | null;
  accent_color: string;
}[];

export type DungeonsEntriesResponse = {
  dungeon_id: number;
  entries_count: number;
  avg_time: number | null;
}[];

export type StatisticsData = {
  total_runs: number;
  total_time_spent: number;
  most_played_dungeon: { id: number; count: number } | null;
  most_played_character: { id: number; count: number } | null;
  avg_clear_time: number;
};

export function getDungeonImage(id: number) {
  return (
    {
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
    }[id] || ""
  );
}

export function formatDungeonAverageTime(
  seconds: number | null | undefined
): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return "--";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export async function getDungeons(baseUrl: string): Promise<DungeonsResponse> {
  const response = await fetch(`${baseUrl}/dungeons`);
  const { data } = await response.json();
  return data;
}

export async function getDungeonsEntries(
  baseUrl: string,
  characterId: number | null
): Promise<DungeonsEntriesResponse> {
  if (!characterId) return [];
  const response = await fetch(
    `${baseUrl}/dungeons_entries?character_id=${characterId}`
  );
  const { data } = await response.json();
  return data;
}

export async function getStatistics(baseUrl: string): Promise<StatisticsData> {
  const response = await fetch(`${baseUrl}/statistics`);
  const { data } = await response.json();
  return data;
}

export function formatDungeons(
  dungeons: DungeonsResponse,
  entries: DungeonsEntriesResponse
): Dungeon[] {
  return dungeons.map((d) => {
    const entry = entries.find((e) => e.dungeon_id === d.id) || {
      entries_count: 0,
      avg_time: null as null,
    };

    return {
      id: d.id,
      name: d.name,
      type: d.type,
      displayName: d.display_name,
      image: getDungeonImage(d.id),
      entryLimit: d.entry_limit,
      entryPeriod: d.entry_period as "daily" | "weekly" | null,
      resetDay: d.reset_day,
      accentColor: d.accent_color,
      entriesCount: entry.entries_count,
      avgTime: entry.avg_time,
    };
  });
}

export function isDungeonComplete(dungeon: Dungeon): boolean {
  if (dungeon.entryLimit === null) return false; // Can play infinitely or we don't track it as "completable" here
  return dungeon.entriesCount >= dungeon.entryLimit;
}

export function getDungeonProgressText(dungeon: Dungeon): string {
  if (dungeon.entryLimit === null) return "";
  return `${dungeon.entriesCount}/${dungeon.entryLimit}`;
}
