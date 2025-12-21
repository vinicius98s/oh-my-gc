import { Character } from "../utils/characters";
import { Dungeon } from "../utils/dungeons";

type GameStatusProps = {
  character?: Character;
  dungeon?: Dungeon;
  nextCharacter?: Character;
  isAllDone?: boolean;
};

export default function GameStatus({
  character,
  dungeon,
  nextCharacter,
  isAllDone,
}: GameStatusProps) {
  if (!character) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl transition-all duration-500 hover:shadow-purple-500/5 group">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/80 z-10" />
        </div>

        <div className="relative z-10 p-6">
          <div className="flex flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full opacity-75 blur transition duration-500 bg-gradient-to-r from-gray-700 to-gray-800" />
              <div className="relative h-24 w-24 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center shadow-xl">
                <span className="mb-2 text-4xl">🎮</span>
              </div>
              <div className="absolute bottom-0 right-0 rounded-full bg-red-500 p-2 ring-4 ring-gray-900">
                <div className="h-2 w-2 rounded-full bg-white opacity-50" />
              </div>
            </div>

            <div className="flex-1 text-left space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Game Status
              </p>
              <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-lg">
                Waiting for Character...
              </h2>
              <p className="text-sm text-gray-400">
                Make sure to have the game open and running
                <br />
                We will detect when you select a character
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl transition-all duration-500 hover:shadow-purple-500/5 group">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/80 z-10" />
        <img
          src={dungeon ? dungeon.image : character.image}
          alt="Background"
          className="h-full w-full object-cover opacity-40 blur-xl transition-all duration-700"
        />
      </div>

      <div className="relative z-10 p-6">
        <div className="flex flex-row items-center gap-8">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-full opacity-75 blur transition duration-500 group-hover:opacity-100"
              style={{
                background: `linear-gradient(to right, ${character.colorTheme.from}, ${character.colorTheme.to})`,
              }}
            />
            <img
              src={character.image}
              alt={character.displayName}
              className="relative h-24 w-24 rounded-full border-2 bg-gray-800 object-cover shadow-xl transition-transform duration-500 group-hover:scale-105"
              style={{ borderColor: character.colorTheme.from }}
            />
            {dungeon ? (
              <div className="absolute bottom-0 right-0 rounded-full bg-green-500 p-2 ring-4 ring-gray-900">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
            ) : (
              <div className="absolute bottom-0 right-0 rounded-full bg-yellow-500 p-2 ring-4 ring-gray-900">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-left space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] mb-1 text-gray-400 uppercase tracking-wider">
                  Currently Playing
                </p>
                <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-lg">
                  {character.displayName}
                </h2>
              </div>

              {nextCharacter ? (
                <div className="text-right">
                  <p className="text-[10px] mb-1 text-blue-300 uppercase tracking-wider">
                    Recommended Next
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-lg font-bold text-white drop-shadow-lg">
                      {nextCharacter.displayName}
                    </span>
                    <img
                      src={nextCharacter.image}
                      alt={nextCharacter.displayName}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-blue/40"
                    />
                  </div>
                </div>
              ) : isAllDone ? (
                <div className="text-right">
                  <p className="text-[10px] mb-1 text-gray-400 uppercase tracking-wider">
                    Daily Schedule
                  </p>
                  <span className="text-lg text-white font-bold drop-shadow-lg flex items-center justify-end gap-2">
                    All Done <span className="text-green-400">✓</span>
                  </span>
                </div>
              ) : null}
            </div>

            {dungeon ? (
              <div className="flex flex-row items-center gap-4 rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/5 transition-colors hover:bg-white/10 hover:border-white/10">
                <img
                  src={dungeon.image}
                  alt={dungeon.displayName}
                  className="h-12 w-12 rounded-lg object-cover shadow-sm ring-1 ring-white/20 animate-playing outline-2 outline-white/20"
                />
                <div>
                  <p className="text-[10px] mb-1 text-purple-300 uppercase tracking-wider">
                    Exploring Dungeon
                  </p>
                  <p className="text-white font-semibold text-base leading-tight">
                    {dungeon.displayName}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10" />
                <div>
                  <p className="text-[10px] mb-1 text-gray-400 uppercase tracking-wider">
                    Status
                  </p>
                  <p className="font-semibold text-gray-100 text-base leading-tight">
                    In Lobby
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
