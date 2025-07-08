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

export type Character = {
  id: number;
  name: string;
  image: string;
  displayName: string;
};

export const characters: Character[] = [
  { id: 1, name: "elesis", image: elesis, displayName: "Elesis" },
  { id: 2, name: "lire", image: lire, displayName: "Lire" },
  { id: 3, name: "arme", image: arme, displayName: "Arme" },
  { id: 4, name: "lass", image: lass, displayName: "Lass" },
  { id: 5, name: "ryan", image: ryan, displayName: "Ryan" },
  { id: 6, name: "ronan", image: ronan, displayName: "Ronan" },
  { id: 7, name: "amy", image: amy, displayName: "Amy" },
  { id: 8, name: "jin", image: jin, displayName: "Jin" },
  { id: 9, name: "sieghart", image: sieghart, displayName: "Sieghart" },
  { id: 10, name: "mari", image: mari, displayName: "Mari" },
  { id: 11, name: "dio", image: dio, displayName: "Dio" },
  { id: 12, name: "zero", image: zero, displayName: "Zero" },
  { id: 13, name: "rey", image: rey, displayName: "Rey" },
  { id: 14, name: "lupus", image: lupus, displayName: "Lupus" },
  { id: 15, name: "lin", image: lin, displayName: "Lin" },
  { id: 16, name: "azin", image: azin, displayName: "Azin" },
  { id: 17, name: "holy", image: holy, displayName: "Holy" },
  { id: 18, name: "edel", image: edel, displayName: "Edel" },
  { id: 19, name: "veigas", image: veigas, displayName: "Veigas" },
  { id: 20, name: "decane", image: decane, displayName: "Decane" },
  { id: 21, name: "ai", image: ai, displayName: "Ai" },
  { id: 22, name: "kallia", image: kallia, displayName: "Kallia" },
  { id: 23, name: "uno", image: uno, displayName: "Uno" },
];

export function getCharacterByName(name: string) {
  return characters.find((c) => c.name === name);
}

export function getCharacterById(id: string | number) {
  return characters.find((c) => c.id === Number(id));
}

export type TrackedCharactersResponse = { id: number; name: string }[];

export async function getTrackedCharacters(baseUrl: string) {
  const response = await fetch(`${baseUrl}/tracked_characters`);
  const { data } = await response.json() as { data: TrackedCharactersResponse };
  return data;
}
