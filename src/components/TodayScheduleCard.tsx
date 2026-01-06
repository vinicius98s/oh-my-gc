import { formatDungeonAverageTime, Dungeon } from "../utils/dungeons";
import { cn } from "../utils/lib";

type TodayScheduleCardProps = {
  dungeon: Dungeon;
  isComplete: boolean;
  progressText: string;
  variant?: "default" | "mini";
};

export default function TodayScheduleCard({
  dungeon,
  isComplete,
  progressText,
  variant = "default",
}: TodayScheduleCardProps) {
  if (variant === "mini") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all duration-200 min-w-[80px]",
          isComplete
            ? "bg-white/5 opacity-50 border-white/5"
            : "bg-white/10 border-white/10 hover:bg-white/15"
        )}
        style={{
          borderColor: isComplete ? undefined : `${dungeon.accentColor}33`,
        }}
      >
        <div className="relative flex-shrink-0">
          <img
            src={dungeon.image}
            alt={dungeon.displayName}
            className={cn(
              "w-10 h-10 rounded shadow-sm",
              isComplete ? "grayscale scale-90" : ""
            )}
          />
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded backdrop-blur-[0.5px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center w-full min-w-0 text-center">
          <p
            className={cn(
              "text-[10px] font-bold truncate w-full leading-tight",
              isComplete ? "text-gray-500 line-through" : "text-gray-100"
            )}
          >
            {dungeon.displayName}
          </p>
          <p className="text-[9px] text-light-blue font-bold">
            {formatDungeonAverageTime(dungeon.avgTime)}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex-shrink-0 w-36 rounded-lg py-4 px-3 border-1 flex flex-col items-center gap-2 group transition-all duration-200",
        isComplete ? "bg-gray/10 opacity-60" : "bg-gray/30 hover:bg-gray/40"
      )}
      style={{
        borderColor: isComplete
          ? "rgba(255, 255, 255, 0.1)"
          : `${dungeon.accentColor}4D`,
        boxShadow: isComplete ? "none" : `0 0 12px ${dungeon.accentColor}20`,
      }}
    >
      <div className="relative">
        <img
          src={dungeon.image}
          alt={dungeon.displayName}
          className={cn(
            "w-16 h-16 rounded-lg shadow-md transition-transform duration-200 group-hover:scale-105",
            isComplete ? "grayscale" : ""
          )}
        />
        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-[1px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 items-center w-full h-full">
        <span
          className={cn(
            "h-9 text-sm text-center font-medium line-clamp-2 leading-tight",
            isComplete
              ? "text-gray-400 line-through"
              : "text-gray-200 group-hover:text-white"
          )}
        >
          {dungeon.displayName}
        </span>

        {progressText && (
          <span className="text-xs font-semibold text-white">
            {progressText}
          </span>
        )}

        <div className="mt-auto pt-4 text-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
            Avg Time
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              isComplete ? "text-gray-500" : "text-gray-300"
            )}
          >
            {formatDungeonAverageTime(dungeon.avgTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
