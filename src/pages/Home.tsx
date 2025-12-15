import { useMemo } from "react";
import { useDataContext } from "../DataContext";

import DungeonsList from "../components/DungeonsList";
import { formatDungeons } from "../utils/dungeons";

export default function Home() {
  const {
    playingCharacter,
    playingDungeon,
    dungeons,
    dungeonsEntries,
    trackedCharacters,
  } = useDataContext();

  const formattedDungeons = useMemo(() => {
    return formatDungeons(dungeons, dungeonsEntries, trackedCharacters.length);
  }, [dungeons, dungeonsEntries, trackedCharacters]);

  const heroDungeons = formattedDungeons.filter(
    (d) => d.type === "hero-dungeon",
  );
  const voidRaidDungeons = formattedDungeons.filter(
    (d) => d.type === "void-raid-dungeon",
  );
  const eventDungeons = formattedDungeons.filter(
    (d) => d.type === "event-dungeon",
  );

  if (!playingCharacter) {
    return (
      <div className="h-screen flex items-center justify-center text-center">
        Could not find any playing character.
        <br />
        Make sure to have the game open and running.
      </div>
    );
  }

  const currentlyPlayingDungeonName = [
    ...heroDungeons,
    ...voidRaidDungeons,
    ...eventDungeons,
  ].find((dungeon) => dungeon.name === playingDungeon);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-10">
        <p className="text-md font-semibold mb-4">Game status</p>

        <div className="flex gap-4 mb-8">
          <img
            src={playingCharacter.image}
            className="border-white rounded-md border-2"
          />
          <div>
            <p className="text-sm">Currently playing:</p>
            <p className="text-lg font-semibold">
              {playingCharacter.displayName}
            </p>
            <p className="text-sm h-6">
              {currentlyPlayingDungeonName?.displayName}
            </p>
          </div>
        </div>

        {heroDungeons.length > 0 && (
          <div>
            <p className="mb-4 text-light-blue">Hero Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={heroDungeons}
            />
          </div>
        )}

        {voidRaidDungeons.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-light-blue">Void Raid Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={voidRaidDungeons}
            />
          </div>
        )}

        {eventDungeons.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-light-blue">Event Dungeons</p>
            <DungeonsList
              playingCharacterId={playingCharacter.id}
              dungeons={eventDungeons}
            />
          </div>
        )}
      </div>
    </div>
  );
}
