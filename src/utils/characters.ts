import elesis from "../assets/characters/elesis.png";
import lire from "../assets/characters/lire.png";
import arme from "../assets/characters/arme.png";
import lass from "../assets/characters/lass.png";
import ryan from "../assets/characters/ryan.png";
import ronan from "../assets/characters/ronan.png";
import amy from "../assets/characters/amy.png";
import jin from "../assets/characters/jin.png";
import sieghart from "../assets/characters/sieghart.png";
import mari from "../assets/characters/mari.png";
import dio from "../assets/characters/dio.png";
import zero from "../assets/characters/zero.png";
import rey from "../assets/characters/rey.png";
import lupus from "../assets/characters/lupus.png";
import lin from "../assets/characters/lin.png";
import azin from "../assets/characters/azin.png";
import holy from "../assets/characters/holy.png";
import edel from "../assets/characters/edel.png";
import veigas from "../assets/characters/veigas.png";
import decane from "../assets/characters/decane.png";
import ai from "../assets/characters/ai.png";
import kallia from "../assets/characters/kallia.png";
import uno from "../assets/characters/uno.png";
import iris from "../assets/characters/iris.png";

const characterImages: Record<number, string> = {
  1: elesis,
  2: lire,
  3: arme,
  4: lass,
  5: ryan,
  6: ronan,
  7: amy,
  8: jin,
  9: sieghart,
  10: mari,
  11: dio,
  12: zero,
  13: rey,
  14: lupus,
  15: lin,
  16: azin,
  17: holy,
  18: edel,
  19: veigas,
  20: decane,
  21: ai,
  22: kallia,
  23: uno,
  24: iris,
};

export type Character = {
  id: number;
  name: string;
  image: string;
  displayName: string;
  colorTheme: {
    from: string;
    to: string;
  };
};

export type CharactersResponse = Character[];

export async function getCharacters(baseUrl: string) {
  const response = await fetch(`${baseUrl}/characters`);
  const { data } = (await response.json()) as {
    data: CharactersResponse;
  };
  return data.map((c) => ({
    ...c,
    image: characterImages[c.id],
  }));
}

export function getCharacterByName(name: string, charactersList: Character[]) {
  return charactersList.find((c) => c.name === name);
}

export function getCharacterById(
  id: string | number,
  charactersList: Character[]
) {
  return charactersList.find((c) => c.id === Number(id));
}

export type CharacterSchedule = Record<string, number[]>;

export type TrackedCharactersResponse = {
  id: number;
  name: string;
  schedule: CharacterSchedule;
}[];

export async function getTrackedCharacters(baseUrl: string) {
  const response = await fetch(`${baseUrl}/tracked_characters`);
  const { data } = (await response.json()) as {
    data: TrackedCharactersResponse;
  };
  return data;
}

export type RecommendationResponse = {
  recommendation: {
    id: number;
    name: string;
  } | null;
  isAllDone: boolean;
};

export async function getNextCharacterRecommendation(
  baseUrl: string,
  characterId: number | null,
  dungeonId: number | null
): Promise<RecommendationResponse> {
  const params = new URLSearchParams();
  if (characterId) params.append("character_id", characterId.toString());
  if (dungeonId) params.append("dungeon_id", dungeonId.toString());

  const response = await fetch(`${baseUrl}/recommend?${params.toString()}`);
  const { data } = (await response.json()) as { data: RecommendationResponse };
  return data;
}
