import { RefreshCw, Sparkles, X } from "lucide-react";
import { useDataContext } from "../DataContext";

export default function UpdateBanner() {
  const {
    isUpdateBannerVisible,
    setIsUpdateBannerVisible,
    setIsUpdateModalOpen,
    newVersion,
    updateStatus,
  } = useDataContext();

  if (!isUpdateBannerVisible || updateStatus === "idle") return null;

  return (
    <div className="flex h-8 items-center justify-between bg-blue-500/10 px-4 border-b border-blue-500/20 backdrop-blur-md animate-slide-down">
      <div
        className="flex flex-1 cursor-pointer items-center justify-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        onClick={() => {
          setIsUpdateModalOpen(true);
          setIsUpdateBannerVisible(false);
        }}
      >
        {updateStatus === "downloaded" ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin-slow" />
            <span>Update ready to install! Click to restart.</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3" />
            <span className="text-white">
              New version {newVersion} available. Click to view details.
            </span>
          </>
        )}
      </div>
      <button
        onClick={() => setIsUpdateBannerVisible(false)}
        className="text-blue-400 hover:text-white transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
