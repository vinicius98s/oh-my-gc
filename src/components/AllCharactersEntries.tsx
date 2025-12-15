import { useState } from "react";

import { getCharacterById } from "../utils/characters";

type Props = {
  allCharactersEntries: number;
  totalCharactersEntries: number;
  entryLimit: number;
  charactersEntries: {
    entries_count: number;
    character_id: number;
  }[];
};

export default function AllCharactersEntries(props: Props) {
  const [displayCharacters, setDisplayCharacters] = useState(false);
  const [page, setPage] = useState(0);

  const maxPage = Math.ceil(props.charactersEntries.length / 3);
  const isPrevDisabled = page === 0;
  const isNextDisabled = page === maxPage - 1;

  if (!props.entryLimit) {
    // If no limit, maybe just show total count? Or nothing?
    // For now, if no limit, we can't really show "progress" vs "limit".
    // Let's just return null or simple count if needed.
    // But for current dungeons (Angry Boss no limit), we might want to hide this component?
    return null;
  }

  return (
    <div className="flex w-full">
      {displayCharacters ? (
        <button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={isPrevDisabled}
          className="cursor-pointer px-0.5 mr-1 disabled:opacity-25 disabled:cursor-default"
        >
          {"<"}
        </button>
      ) : null}
      <button
        onClick={() => setDisplayCharacters((prev) => !prev)}
        className="text-sm bg-gray w-full h-9 p-1 rounded cursor-pointer"
      >
        {displayCharacters ? (
          <div className="flex gap-2 justify-between">
            {props.charactersEntries
              .slice(page * 3, page * 3 + 3)
              .map(({ character_id, entries_count }) => {
                const done = entries_count >= props.entryLimit;
                const character = getCharacterById(character_id);
                if (!character) return null;
                return (
                  <span
                    key={character.id}
                    title={`${character.displayName}: ${entries_count}/${props.entryLimit}`}
                  >
                    <img
                      src={character.image}
                      className={`${done ? "opacity-20" : ""} h-7 rounded`}
                    />
                  </span>
                );
              })}
          </div>
        ) : (
          <p>
            {props.allCharactersEntries}/{props.totalCharactersEntries}
          </p>
        )}
      </button>
      {displayCharacters ? (
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={isNextDisabled}
          className="cursor-pointer px-0.5 mr-1 disabled:opacity-25 disabled:cursor-default"
        >
          {">"}
        </button>
      ) : null}
    </div>
  );
}
