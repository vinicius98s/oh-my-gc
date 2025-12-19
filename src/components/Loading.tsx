export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-3 h-10">
        {["bg-zinc-400", "bg-zinc-500", "bg-zinc-600"].map((color, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full ${color} animate-bounce-soft`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
