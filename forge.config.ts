import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { PublisherGithub } from "@electron-forge/publisher-github";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import path from "path";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const iconPath = path.resolve(__dirname, "src/assets/icon.ico");

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: [
      "./backend/dist/main.exe",
      "./backend/third-party",
      "./backend/templates",
      "./backend/migrations",
    ],
    icon: "./src/assets/icon.ico",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupExe: "OhMyGC-Setup.exe",
      setupIcon: iconPath,
      iconUrl:
        "https://github.com/vinicius98s/oh-my-gc/raw/main/src/assets/icon.ico",
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "vinicius98s",
        name: "oh-my-gc",
      },
      prerelease: false,
      draft: true,
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
