import Modal from "./Modal";
import Button from "./Button";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { useDataContext } from "../DataContext";

export default function UpdateModal() {
  const {
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    updateStatus,
    newVersion,
    setIsUpdateBannerVisible,
    setUpdateStatus,
    updateProgress,
    updateError,
  } = useDataContext();

  const handleDownload = () => {
    setUpdateStatus("downloading");
    // Native autoUpdater handles download automatically, so we just update the UI state
  };

  const handleInstall = () => {
    window.electron.installUpdate();
  };

  const handleClose = () => {
    setIsUpdateModalOpen(false);
    if (updateStatus !== "idle") {
      setIsUpdateBannerVisible(true);
    }
  };

  if (!isUpdateModalOpen) return null;

  return (
    <Modal
      isOpen={isUpdateModalOpen}
      onClose={handleClose}
      title={updateStatus === "downloaded" ? "Update Ready!" : "Update Found"}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            {updateStatus === "downloaded" ? (
              <RefreshCw className="h-6 w-6 animate-spin-slow" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="font-medium text-white">
              {updateStatus === "downloaded"
                ? "The download is complete."
                : updateStatus === "error"
                  ? "Update Error"
                  : updateStatus === "available" ||
                      updateStatus === "downloading"
                    ? "A new version is being downloaded..."
                    : `Version ${newVersion} is now available!`}
            </p>
            <p className="text-sm text-gray-400">
              {(updateStatus === "available" ||
                updateStatus === "downloading") &&
                "The application is downloading the latest update in the background."}
              {updateStatus === "downloaded" &&
                "Restart the app to apply the update and enjoy new features."}
              {updateStatus === "error" &&
                (updateError || "An error occurred while updating.")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          {(updateStatus === "available" || updateStatus === "downloading") && (
            <Button variant="secondary" onClick={handleClose}>
              Dismiss
            </Button>
          )}

          {updateStatus === "downloaded" && (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Later
              </Button>
              <Button
                onClick={handleInstall}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Restart & Update
              </Button>
            </>
          )}

          {updateStatus === "error" && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
