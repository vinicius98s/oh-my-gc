import { formatETC } from "../utils/dungeons";

interface ETCResult {
  totalSeconds: number;
  isComplete: boolean;
  hasMissingData: boolean;
}

interface ScheduleETCProps {
  characterETC: ETCResult;
  dayETC: ETCResult;
}

export default function ScheduleETC({
  characterETC,
  dayETC,
}: ScheduleETCProps) {
  return (
    <div className="flex gap-3 ml-4">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase font-bold leading-tight">
          Character ETC
        </span>
        <span className="text-xs text-white font-medium flex items-center gap-1">
          {characterETC.isComplete ? (
            <span className="text-light-blue uppercase text-[10px] font-bold">
              Done
            </span>
          ) : (
            <>
              {formatETC(characterETC.totalSeconds)}
              {characterETC.hasMissingData && (
                <span className="text-gray-500 text-[10px] italic">(+)</span>
              )}
              {characterETC.totalSeconds === 0 &&
                !characterETC.hasMissingData && (
                  <span className="text-gray-500 italic text-[10px]">
                    No data
                  </span>
                )}
            </>
          )}
        </span>
      </div>
      <div className="w-[1px] h-6 bg-white/10 self-center" />
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase font-bold leading-tight">
          Total Day ETC
        </span>
        <span className="text-xs text-white font-medium flex items-center gap-1">
          {dayETC.isComplete ? (
            <span className="text-light-blue uppercase text-[10px] font-bold">
              Done
            </span>
          ) : (
            <>
              {formatETC(dayETC.totalSeconds)}
              {dayETC.hasMissingData && (
                <span className="text-gray-500 text-[10px] italic">(+)</span>
              )}
              {dayETC.totalSeconds === 0 && !dayETC.hasMissingData && (
                <span className="text-gray-500 italic text-[10px]">
                  No data
                </span>
              )}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
