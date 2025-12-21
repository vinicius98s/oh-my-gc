import { useDataContext } from "../DataContext";
import { formatDungeonAverageTime, getDungeonImage } from "../utils/dungeons";
import { getCharacterById } from "../utils/characters";

export default function Statistics() {
  const { statistics: stats, dungeons } = useDataContext();

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white animate-pulse font-medium">
          Loading stats...
        </div>
      </div>
    );
  }

  const mostPlayedDungeon = stats.most_played_dungeon
    ? dungeons.find((d) => d.id === stats.most_played_dungeon!.id)
    : null;

  const mostPlayedCharacter = stats.most_played_character
    ? getCharacterById(stats.most_played_character.id)
    : null;

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const mainStats = [
    {
      label: "Total Runs",
      value: stats.total_runs.toString(),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
        >
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "Total Time Spent",
      value: formatTotalTime(stats.total_time_spent),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Global Avg Time",
      value: formatDungeonAverageTime(stats.avg_clear_time),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight mb-6">
          Statistics
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {mainStats.map((stat, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-gray-900/80 p-5 group transition-all duration-300 hover:border-white/20 hover:shadow-lg"
            >
              <div
                className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`}
              />
              <div className="relative z-10">
                <div
                  className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.gradient} bg-opacity-20 text-white mb-3 shadow-inner`}
                >
                  {stat.icon}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 p-6 transition-all duration-300 hover:bg-gray-900/60">
            {mostPlayedDungeon && (
              <div
                className="absolute inset-0 opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20 translate-x-1/2"
                style={{ backgroundColor: mostPlayedDungeon.accent_color }}
              />
            )}

            <div className="relative z-10 flex items-center gap-6">
              <div className="relative shrink-0">
                {mostPlayedDungeon ? (
                  <>
                    <div
                      className="absolute -inset-1 rounded-lg opacity-30 blur group-hover:opacity-50 transition-opacity"
                      style={{
                        backgroundColor: mostPlayedDungeon.accent_color,
                      }}
                    />
                    <img
                      src={getDungeonImage(mostPlayedDungeon.id)}
                      alt={mostPlayedDungeon.display_name}
                      className="w-18 relative rounded-lg object-cover border border-white/10 shadow-2xl"
                      style={{
                        borderColor: mostPlayedDungeon.accent_color,
                      }}
                    />
                  </>
                ) : (
                  <div className="h-20 w-32 rounded-lg bg-white/5 border border-white/10" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1">
                  Most Played Dungeon
                </p>
                <h3 className="text-lg font-bold text-white mb-1">
                  {mostPlayedDungeon?.display_name || "—"}
                </h3>
                <p className="mt-auto text-sm text-gray-400">
                  <span className="text-white font-bold">
                    {stats.most_played_dungeon?.count || 0}
                  </span>{" "}
                  runs completed
                </p>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 p-6 transition-all duration-300 hover:bg-gray-900/60">
            {mostPlayedCharacter && (
              <div
                className="absolute inset-0 opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20 translate-x-1/2"
                style={{ backgroundColor: mostPlayedCharacter.colorTheme.from }}
              />
            )}

            <div className="h-full relative z-10 flex items-center gap-6">
              <div className="relative shrink-0">
                {mostPlayedCharacter ? (
                  <>
                    <div
                      className="absolute -inset-1 rounded-lg opacity-30 blur group-hover:opacity-50 transition-opacity"
                      style={{
                        backgroundColor: mostPlayedCharacter.colorTheme.from,
                      }}
                    />
                    <img
                      src={mostPlayedCharacter.image}
                      alt={mostPlayedCharacter.displayName}
                      className="w-18 relative rounded-lg object-cover border border-white/10 shadow-2xl"
                      style={{
                        borderColor: mostPlayedCharacter.colorTheme.from,
                      }}
                    />
                  </>
                ) : (
                  <div className="h-20 w-32 rounded-lg bg-white/5 border border-white/10" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1">
                  Favorite Character
                </p>
                <h3 className="text-lg font-bold text-white mb-1">
                  {mostPlayedCharacter?.displayName || "—"}
                </h3>
                <p className="mt-auto text-sm text-gray-400">
                  <span className="text-white font-bold">
                    {stats.most_played_character?.count || 0}
                  </span>{" "}
                  runs completed
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">
            Data updated automatically based on game events
          </p>
        </div>
      </div>
    </div>
  );
}
