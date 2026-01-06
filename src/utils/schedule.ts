import { Character, RecommendationResponse } from "./characters";

export function getNextCharacter(
  recommendedCharacter: RecommendationResponse | null | undefined,
  characters: Character[]
): Character | null {
  if (!recommendedCharacter?.recommendation) return null;
  return characters.find((c) => c.id === recommendedCharacter.recommendation!.id) || null;
}
