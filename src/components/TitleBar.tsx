import { CSSProperties } from "react";

export default function TitleBar() {
  return (
    <header className="h-8 flex items-center bg-[#0A2A48] text-white select-none">
      <div
        className="flex-grow pl-2 text-sm"
        style={{ WebkitAppRegion: "drag" } as CSSProperties}
      >
        Oh My GC
      </div>
      <div className="flex">
        <button
          onClick={() => window.electron.minimizeWindow()}
          className="size-8 hover:bg-gray-700"
          tabIndex={-1}
          style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
        >
          —
        </button>
        <button
          onClick={() => window.electron.closeWindow()}
          tabIndex={-1}
          className="size-8 hover:bg-red-600"
          style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
        >
          ×
        </button>
      </div>
    </header>
  );
}
