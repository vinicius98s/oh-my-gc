import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "../components/Button";
import ScheduleBuilder, { ScheduleState } from "../components/ScheduleBuilder";
import { useDataContext } from "../DataContext";
import { cn } from "../utils/lib";
import ohMyGCLogo from "../assets/logo.png";

export default function Onboarding() {
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const [step, setStep] = useState(1);

  const { url, characters } = useDataContext();
  const queryClient = useQueryClient();

  const isSelected = (characterId: number) => {
    return selectedCharacters.includes(characterId);
  };

  const toggleCharacter = (characterId: number) => {
    setSelectedCharacters(
      selectedCharacters.includes(characterId)
        ? selectedCharacters.filter((c) => c !== characterId)
        : [...selectedCharacters, characterId]
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
    mutationFn: async (payload: {
      characters: number[];
      schedules: ScheduleState;
    }) => {
      const response = await fetch(`${url}/tracked_characters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const { data } = await response.json();
      return data;
    },
  });

  const handleConfirm = (schedules: ScheduleState) => {
    mutation.mutate(
      { characters: selectedCharacters, schedules },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["tracked_characters"] });
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full pt-4 px-10 overflow-hidden text-white">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-xl">Welcome to</h1>
        <img src={ohMyGCLogo} className="w-32" />
      </div>

      <div className="flex gap-4 items-center justify-center my-4 mb-6">
        <Button
          className={cn(
            "rounded-full text-sm size-8 p-0 items-center justify-center flex",
            step !== 1 ? "from-light-gray to-gray" : ""
          )}
          onClick={() => setStep(1)}
        >
          1
        </Button>
        <div className="h-[2px] w-12 bg-gray-600"></div>
        <Button
          className="rounded-full text-sm size-8 p-0 items-center justify-center flex"
          disabled={step !== 2}
        >
          2
        </Button>
      </div>

      {step === 1 && (
        <>
          <h2 className="mb-4 font-semibold text-md text-center">
            Select the characters you want to track
          </h2>

          <div className="flex flex-wrap gap-4">
            {characters.map(({ id, image }) => (
              <button
                className={`${isSelected(id) ? "border-blue opacity-100" : "border-transparent opacity-30"} rounded-md border-2 cursor-pointer focus:outline-1 outline-white outline-offset-1`}
                key={id}
                onClick={() => toggleCharacter(id)}
              >
                <img src={image} className="rounded-md w-[60px] h-[60px]" />
              </button>
            ))}
          </div>

          <div className="flex w-full justify-center gap-2 mt-8">
            <Button onClick={toggleAll}>Toggle all</Button>
            <Button
              disabled={selectedCharacters.length === 0}
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="mb-4 font-semibold text-md text-center">
            Build your schedule for each character
          </h2>
          <div className="flex-1 min-h-0">
            <ScheduleBuilder
              selectedCharacterIds={selectedCharacters}
              onConfirm={handleConfirm}
            />
          </div>
        </>
      )}
    </div>
  );
}
