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

export const characters: Character[] = [
  {
    id: 1,
    name: "elesis",
    image: elesis,
    displayName: "Elesis",
    colorTheme: { from: "#ef4444", to: "#b91c1c" }, // Red-500 to Red-700
  },
  {
    id: 2,
    name: "lire",
    image: lire,
    displayName: "Lire",
    colorTheme: { from: "#84cc16", to: "#4d7c0f" }, // Lime-500 to Lime-700
  },
  {
    id: 3,
    name: "arme",
    image: arme,
    displayName: "Arme",
    colorTheme: { from: "#d946ef", to: "#a21caf" }, // Fuchsia-500 to Fuchsia-700
  },
  {
    id: 4,
    name: "lass",
    image: lass,
    displayName: "Lass",
    colorTheme: { from: "#06b6d4", to: "#0e7490" }, // Cyan-500 to Cyan-700
  },
  {
    id: 5,
    name: "ryan",
    image: ryan,
    displayName: "Ryan",
    colorTheme: { from: "#f97316", to: "#c2410c" }, // Orange-500 to Orange-700
  },
  {
    id: 6,
    name: "ronan",
    image: ronan,
    displayName: "Ronan",
    colorTheme: { from: "#3b82f6", to: "#1d4ed8" }, // Blue-500 to Blue-700
  },
  {
    id: 7,
    name: "amy",
    image: amy,
    displayName: "Amy",
    colorTheme: { from: "#f472b6", to: "#be185d" }, // Pink-400 to Pink-700
  },
  {
    id: 8,
    name: "jin",
    image: jin,
    displayName: "Jin",
    colorTheme: { from: "#ef4444", to: "#991b1b" }, // Red-500 to Red-800
  },
  {
    id: 9,
    name: "sieghart",
    image: sieghart,
    displayName: "Sieghart",
    colorTheme: { from: "#1f2937", to: "#000000" }, // Gray-800 to Black
  },
  {
    id: 10,
    name: "mari",
    image: mari,
    displayName: "Mari",
    colorTheme: { from: "#0ea5e9", to: "#0369a1" }, // Sky-500 to Sky-700
  },
  {
    id: 11,
    name: "dio",
    image: dio,
    displayName: "Dio",
    colorTheme: { from: "#a855f7", to: "#6b21a8" }, // Purple-500 to Purple-800
  },
  {
    id: 12,
    name: "zero",
    image: zero,
    displayName: "Zero",
    colorTheme: { from: "#10b981", to: "#047857" }, // Emerald-500 to Emerald-700
  },
  {
    id: 13,
    name: "rey",
    image: rey,
    displayName: "Rey",
    colorTheme: { from: "#c026d3", to: "#86198f" }, // Fuchsia-600 to Fuchsia-800
  },
  {
    id: 14,
    name: "lupus",
    image: lupus,
    displayName: "Lupus",
    colorTheme: { from: "#3b82f6", to: "#172554" }, // Blue-500 to Blue-950
  },
  {
    id: 15,
    name: "lin",
    image: lin,
    displayName: "Lin",
    colorTheme: { from: "#eab308", to: "#a16207" }, // Yellow-500 to Yellow-700
  },
  {
    id: 16,
    name: "azin",
    image: azin,
    displayName: "Azin",
    colorTheme: { from: "#60a5fa", to: "#2563eb" }, // Blue-400 to Blue-600
  },
  {
    id: 17,
    name: "holy",
    image: holy,
    displayName: "Holy",
    colorTheme: { from: "#fcd34d", to: "#ca8a04" }, // Amber-300 to Amber-600
  },
  {
    id: 18,
    name: "edel",
    image: edel,
    displayName: "Edel",
    colorTheme: { from: "#93c5fd", to: "#3b82f6" }, // Blue-300 to Blue-500
  },
  {
    id: 19,
    name: "veigas",
    image: veigas,
    displayName: "Veigas",
    colorTheme: { from: "#8b5cf6", to: "#5b21b6" }, // Violet-500 to Violet-800
  },
  {
    id: 20,
    name: "decane",
    image: decane,
    displayName: "Decane",
    colorTheme: { from: "#6b21a8", to: "#3b0764" }, // Purple-800 to Purple-950
  },
  {
    id: 21,
    name: "ai",
    image: ai,
    displayName: "Ai",
    colorTheme: { from: "#22d3ee", to: "#0ea5e9" }, // Cyan-400 to Blue-500
  },
  {
    id: 22,
    name: "kallia",
    image: kallia,
    displayName: "Kallia",
    colorTheme: { from: "#f87171", to: "#dc2626" }, // Red-400 to Red-600
  },
  {
    id: 23,
    name: "uno",
    image: uno,
    displayName: "Uno",
    colorTheme: { from: "#1d4ed8", to: "#172554" }, // Blue-700 to Blue-950
  },
  {
    id: 24,
    name: "iris",
    image: iris,
    displayName: "Iris",
    colorTheme: { from: "#10b981", to: "#0ea5e9" }, // Green-500 to Blue-500
  }
];

export function getCharacterByName(name: string) {
  return characters.find((c) => c.name === name);
}

export function getCharacterById(id: string | number) {
  return characters.find((c) => c.id === Number(id));
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
