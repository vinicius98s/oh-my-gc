import { Character } from "../utils/characters";

interface RecommendedNextProps {
  nextCharacter?: Character;
  isAllDone?: boolean;
  variant?: "normal" | "compact";
}

export default function RecommendedNext({
  nextCharacter,
  isAllDone,
  variant = "normal",
}: RecommendedNextProps) {
  if (!nextCharacter && !isAllDone) return null;

  if (variant === "compact") {
    return (
      <div className="text-right flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-500">
        <p className="text-[10px] text-blue-300 uppercase tracking-wider font-bold">
          Next
        </p>
        {nextCharacter ? (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[10px] font-bold text-white truncate max-w-[60px]">
              {nextCharacter.displayName}
            </span>
            <img
              src={nextCharacter.image}
              alt={nextCharacter.displayName}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-blue-400/30"
            />
          </div>
        ) : (
          <span className="text-[10px] text-green-400 font-bold">
            All Done ✓
          </span>
        )}
      </div>
    );
  }

  // Normal variant (as seen in GameStatus.tsx)
  return (
    <div className="text-right animate-in fade-in slide-in-from-right-4 duration-700">
      {nextCharacter ? (
        <>
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
        </>
      ) : (
        <>
          <p className="text-[10px] mb-1 text-gray-400 uppercase tracking-wider">
            Daily Schedule
          </p>
          <span className="text-lg text-white font-bold drop-shadow-lg flex items-center justify-end gap-2">
            All Done <span className="text-green-400">✓</span>
          </span>
        </>
      )}
    </div>
  );
}
