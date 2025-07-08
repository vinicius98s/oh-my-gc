import { useDataContext } from "../DataContext";

import DungeonsList from "../components/DungeonsList";
import { getDungeonDisplayName } from "../utils/dungeons";

export default function Home() {
  const { playingCharacter, playingDungeon } = useDataContext();

  if (!playingCharacter) {
    return (
      <div className="flex h-screen items-center justify-center">
        Not playing
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-md font-semibold mb-4">Game status</p>

      <div className="flex gap-4">
        <img
          src={playingCharacter.image}
          className="border-white rounded-md border-2"
        />
        <div>
          <p className="text-sm">Currently playing:</p>
          <p className="text-lg font-semibold">
            {playingCharacter.displayName}
          </p>
          {playingDungeon ? (
            <p className="text-sm">{getDungeonDisplayName(playingDungeon)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 w-full">
        <p className="font-semibold mb-4">Hero Dungeon</p>

        <DungeonsList playingCharacterId={playingCharacter.id} />
      </div>
    </div>
  );
}
