import { app } from "electron";
import path from "path";
import fs from "fs";

/**
 * Cleans up old Squirrel.Windows version folders and update packages to save disk space.
 */
export async function cleanUpOldVersions(): Promise<void> {
  if (!app.isPackaged || process.platform !== "win32") {
    return;
  }

  try {
    const currentVersion = app.getVersion();
    // In Squirrel.Windows, the executable is in .../app-<version>/<app>.exe
    // Root is one level up from the app-<version> folder
    const appFolder = path.dirname(process.execPath);
    const rootFolder = path.join(appFolder, "..");

    if (!fs.existsSync(rootFolder)) {
      return;
    }

    const entries = fs.readdirSync(rootFolder, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryName = entry.name;

        // Cleanup old app-<version> folders
        if (
          entryName.startsWith("app-") &&
          entryName !== `app-${currentVersion}`
        ) {
          const oldFolderPath = path.join(rootFolder, entryName);
          console.log(
            `[Cleanup] Removing old version folder: ${oldFolderPath}`
          );
          try {
            fs.rmSync(oldFolderPath, { recursive: true, force: true });
          } catch (err) {
            console.error(`[Cleanup] Failed to remove ${oldFolderPath}:`, err);
          }
        }

        // Cleanup packages folder
        if (entryName === "packages") {
          const packagesPath = path.join(rootFolder, entryName);
          console.log(`[Cleanup] Cleaning packages folder: ${packagesPath}`);
          try {
            const packageFiles = fs.readdirSync(packagesPath);
            for (const file of packageFiles) {
              if (file.endsWith(".nupkg")) {
                fs.unlinkSync(path.join(packagesPath, file));
              }
            }
          } catch (err) {
            console.error(`[Cleanup] Failed to clean ${packagesPath}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Cleanup] Error during cleanup:", err);
  }
}
