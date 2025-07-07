import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "../components/Button";
import { useDataContext } from "../DataContext";
import { characters } from "../utils/characters";

export default function Onboarding() {
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);

  const { url } = useDataContext();
  const queryClient = useQueryClient();

  const isSelected = (characterId: number) => {
    return selectedCharacters.includes(characterId);
  };

  const toggleCharacter = (characterId: number) => {
    setSelectedCharacters(
      selectedCharacters.includes(characterId)
        ? selectedCharacters.filter((c) => c !== characterId)
        : [...selectedCharacters, characterId],
    );
  };

  const toggleAll = () => {
    if (selectedCharacters.length > 0) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters(characters.map(({ id }) => id));
    }
  };

  const mutation = useMutation({
    mutationFn: async (characters: number[]) => {
      const response = await fetch(`${url}/tracked_characters`, {
        method: "POST",
        body: JSON.stringify({ characters }),
      });
      const { data } = await response.json();
      return data;
    },
  });

  const onConfirm = () => {
    mutation.mutate(selectedCharacters, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tracked_characters"] });
      },
    });
  };

  return (
    <div className="mt-10">
      <div className="max-w-sm">
        <h1 className="font-semibold text-xl">Welcome to Oh My GC</h1>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>

      <h2 className="mt-14 mb-4 font-semibold text-lg">
        Select the characters you want to track:
      </h2>

      <div className="flex flex-wrap gap-4">
        {characters.map(({ id, image }) => (
          <button
            className={`${isSelected(id) ? "border-blue opacity-100" : "border-transparent opacity-30"} rounded-md border-2 cursor-pointer focus:outline-1 outline-white outline-offset-1`}
            key={id}
            onClick={() => toggleCharacter(id)}
          >
            <img src={image} className="rounded-md" />
          </button>
        ))}
      </div>

      <div className="flex w-full justify-center gap-2 mt-4">
        <Button onClick={toggleAll}>Toggle all</Button>
        <Button disabled={selectedCharacters.length === 0} onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
