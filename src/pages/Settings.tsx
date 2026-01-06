import { useState, useEffect } from "react";

export default function Settings() {
  const [launchOnStartup, setLaunchOnStartup] = useState(false);
  const [quitOnClose, setQuitOnClose] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const isEnabled = await window.electron.getStartupSetting();
        setLaunchOnStartup(isEnabled);
        const quitOnCloseValue = await window.electron.getQuitOnClose();
        setQuitOnClose(quitOnCloseValue);
        const showOverlayValue = await window.electron.getShowOverlay();
        setShowOverlay(showOverlayValue);
      } catch (error) {
        console.error("Failed to fetch startup setting:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleStartup = async () => {
    const newValue = !launchOnStartup;
    setLaunchOnStartup(newValue);
    try {
      window.electron.setStartupSetting(newValue);
    } catch (error) {
      console.error("Failed to update startup setting:", error);
      setLaunchOnStartup(!newValue);
    }
  };

  const handleToggleQuitOnClose = async () => {
    const newValue = !quitOnClose;
    setQuitOnClose(newValue);
    try {
      window.electron.setQuitOnClose(newValue);
    } catch (error) {
      console.error("Failed to update quit on close setting:", error);
      setQuitOnClose(!newValue);
    }
  };

  const handleToggleShowOverlay = async () => {
    const newValue = !showOverlay;
    setShowOverlay(newValue);
    try {
      window.electron.setShowOverlay(newValue);
    } catch (error) {
      console.error("Failed to update show overlay setting:", error);
      setShowOverlay(!newValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray overflow-hidden">
      <div className="max-w-2xl mx-auto mt-6 w-full pb-4">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 text-sm">Customize your app experience.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl border border-white/5 p-6 transition-all hover:bg-white/[0.07]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    Launch with Windows
                  </h3>
                  <p className="text-sm text-gray-400">
                    Automatically start Oh My GC when you sign in to Windows.
                  </p>
                </div>
                <button
                  disabled={loading}
                  onClick={handleToggleStartup}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                    ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${launchOnStartup ? "bg-blue" : "bg-dark-blue"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${launchOnStartup ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/5 p-6 transition-all hover:bg-white/[0.07]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    Show Overlay
                  </h3>
                  <p className="text-sm text-gray-400">
                    Toggle a floating overlay with game status and ETC.
                  </p>
                  <p className="text-xs text-blue/80 font-medium italic mt-1">
                    Note: Game must be in Borderless Windowed mode for the
                    overlay to be visible.
                  </p>
                </div>
                <button
                  disabled={loading}
                  onClick={handleToggleShowOverlay}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                    ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${showOverlay ? "bg-blue" : "bg-dark-blue"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${showOverlay ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/5 p-6 transition-all hover:bg-white/[0.07]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    Quit when closing
                  </h3>
                  <p className="text-sm text-gray-400">
                    Fully exit the application when the window is closed.
                  </p>
                </div>
                <button
                  disabled={loading}
                  onClick={handleToggleQuitOnClose}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                    ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${quitOnClose ? "bg-blue" : "bg-dark-blue"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${quitOnClose ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <p className="text-xs text-center text-gray-500">
              Oh My GC v{window.version || "1.0.3"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
