import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "./Button";
import NumberInput from "./NumberInput";
import AllCharactersEntries from "./AllCharactersEntries";

import { useDataContext } from "../DataContext";
import { formatDungeons, getCharacterDungeonEntries } from "../utils/dungeons";

type Props = {
  playingCharacterId: number;
};

export default function DungeonsList({ playingCharacterId }: Props) {
  const [isEditing, setIsEditing] = useState(null);
  const [editedValue, setEditedValue] = useState(null);

  const queryClient = useQueryClient();

  const { dungeons, dungeonsEntries, trackedCharacters, url, playingDungeon } =
    useDataContext();

  const mutation = useMutation({
    mutationFn: (body: {
      dungeonId: number;
      value: number;
      characterId: number;
    }) => {
      return fetch(`${url}/dungeons_entries`, {
        body: JSON.stringify(body),
        method: "POST",
      });
    },
  });

  const onEditEntries = (dungeonId: number) => {
    mutation.mutate(
      { dungeonId, value: editedValue, characterId: playingCharacterId },
      {
        onSuccess: () => {
          setIsEditing(null);
          setEditedValue(null);
          queryClient.invalidateQueries({ queryKey: ["dungeons_entries"] });
        },
      },
    );
  };

  return (
    <div className="flex justify-between">
      {formatDungeons(dungeons, dungeonsEntries, trackedCharacters.length).map(
        (dungeon) => {
          const currentCharacterDungeonEntries = getCharacterDungeonEntries(
            dungeonsEntries,
            dungeon.id,
            playingCharacterId,
          );

          return (
            <div
              className={`${dungeon.name === playingDungeon ? "animate-playing" : "outline-transparent"} outline-2 border-1 border-white/10 rounded-md p-4 bg-[#3D4247] w-fit`}
              key={dungeon.id}
            >
              <div className="relative mb-4">
                <img src={dungeon.image} />
                <Button
                  className={`${dungeon.id === 2 ? "px-1 text-xs" : "px-0.5 text-sm"} from-[#0A2A48] to-[#1D78CE] outline-[#CAD8EB]/60 outline-offset-0 py-0.5 rounded-full absolute bottom-0 w-full font-medium cursor-default`}
                >
                  {dungeon.displayName}
                </Button>
              </div>

              <div className="flex flex-col justify-center items-center">
                {isEditing === dungeon.id ? (
                  <div className="flex items-center gap-2 mb-0.5">
                    <button
                      className="cursor-pointer py-1"
                      onClick={() => setIsEditing(null)}
                    >
                      <X className="size-4" />
                    </button>
                    <NumberInput
                      defaultValue={currentCharacterDungeonEntries}
                      min={0}
                      max={dungeon.weeklyEntryLimit}
                      onChangeValue={setEditedValue}
                    />
                    <button
                      className="cursor-pointer py-1"
                      onClick={() => onEditEntries(dungeon.id)}
                    >
                      <Check className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex mb-3 gap-2 items-center cursor-pointer"
                    onClick={() => setIsEditing(dungeon.id)}
                  >
                    <Pencil className="size-4 -ml-6 -mt-0.5" />
                    <p>
                      {currentCharacterDungeonEntries}/
                      {dungeon.weeklyEntryLimit}
                    </p>
                  </div>
                )}

                <AllCharactersEntries
                  charactersEntries={dungeon.charactersEntries}
                  allCharactersEntries={dungeon.allCharactersEntries}
                  totalCharactersEntries={dungeon.totalCharactersEntries}
                  weeklyEntryLimit={dungeon.weeklyEntryLimit}
                />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
