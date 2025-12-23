import { app } from "electron";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";
import fs from "fs";

export class BackendManager {
  private process: ChildProcessWithoutNullStreams | undefined;
  private logStream: fs.WriteStream | undefined;

  async start(port: number): Promise<void> {
    if (!app.isPackaged) {
      return;
    }

    const dataPath = app.getPath("userData");
    const logPath = path.join(dataPath, "backend.log");

    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    const dbPath = path.join(dataPath, "oh-my-gc.sqlite3");

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "");
    }

    this.logStream = fs.createWriteStream(logPath, { flags: "a" });

    const tesseractPath = path.join(
      process.resourcesPath,
      "third-party",
      "tesseract-win64",
      "tesseract.exe",
    );
    const migrationsPath = path.join(process.resourcesPath, "migrations");
    const templatesPath = path.join(process.resourcesPath, "templates");
    const backendPath = path.join(process.resourcesPath, "main.exe");

    this.process = spawn(
      backendPath,
      [
        `--port=${port}`,
        `--user-data=${dataPath}`,
        `--templates=${templatesPath}`,
        `--TESSERACT_PATH=${tesseractPath}`,
        `--migrations=${migrationsPath}`,
        `--parent-pid=${process.pid}`,
      ],
      {
        cwd: process.resourcesPath,
        env: { ...process.env },
        detached: false,
        windowsHide: true,
      },
    );

    if (this.process.stdout && this.logStream) {
      this.process.stdout.pipe(this.logStream);
    }
    if (this.process.stderr && this.logStream) {
      this.process.stderr.pipe(this.logStream);
    }

    this.process.on("error", (err) => {
      fs.appendFileSync(logPath, `Failed to start backend: ${err.message}\n`);
    });

    this.process.on("exit", (code) => {
      fs.appendFileSync(logPath, `Backend process exited with code ${code}\n`);
      this.process = undefined;
    });
  }

  async kill(): Promise<void> {
    if (!this.process || !this.process.pid) {
      return;
    }

    const pid = this.process.pid;

    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", pid.toString(), "/f", "/t"], {
        windowsHide: true,
      });
    } else {
      this.process.kill("SIGTERM");
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 5000);
        this.process?.once("exit", () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });
    }

    this.closeLogStream();
    this.process = undefined;
  }

  private closeLogStream(): void {
    if (this.logStream && !this.logStream.destroyed) {
      this.logStream.end();
      this.logStream = undefined;
    }
  }

  isRunning(): boolean {
    return this.process !== undefined;
  }

  getPid(): number | undefined {
    return this.process?.pid;
  }
}
