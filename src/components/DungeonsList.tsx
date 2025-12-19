import { useMutation, useQueryClient } from "@tanstack/react-query";

import DungeonCard from "./DungeonCard";

import { useDataContext } from "../DataContext";
import { Dungeon } from "../utils/dungeons";

type Props = {
  playingCharacterId: number;
  dungeons: Dungeon[];
};

export default function DungeonsList({ playingCharacterId, dungeons }: Props) {
  const queryClient = useQueryClient();

  const { url } = useDataContext();

  const mutation = useMutation({
    mutationFn: (body: {
      dungeonId: number;
      value: number;
      characterId: number;
      update_mode: "weekly" | "daily";
    }) => {
      return fetch(`${url}/dungeons_entries`, {
        body: JSON.stringify(body),
        method: "POST",
      });
    },
  });

  const onEditEntries = (
    dungeonId: number,
    value: number,
    mode: "weekly" | "daily"
  ) => {
    mutation.mutate(
      { dungeonId, value, characterId: playingCharacterId, update_mode: mode },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["dungeons_entries"] });
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {dungeons.map((dungeon) => (
        <DungeonCard
          key={dungeon.id}
          dungeon={dungeon}
          playingCharacterId={playingCharacterId}
          onEdit={onEditEntries}
        />
      ))}
    </div>
  );
}
