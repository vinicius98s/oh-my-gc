import { useDataContext } from "../DataContext";

import DungeonsList from "../components/DungeonsList";

export default function Home() {
  const { playingCharacter } = useDataContext();

  if (!playingCharacter) {
    return (
      <div className="flex h-screen items-center justify-center">
        Not playing
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-sm">Game status:</p>
      <div className="flex gap-2 items-center mb-6 mt-2">
        <div className="size-2 bg-green-500 rounded-full" />
        <p className="text-md font-semibold">Connected</p>
      </div>

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
        </div>
      </div>

      <div className="mt-8 w-full">
        <p className="font-semibold mb-4">Hero Dungeon</p>

        <DungeonsList playingCharacterId={playingCharacter.id} />
      </div>
    </div>
  );
}
