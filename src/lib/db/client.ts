import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { appConfig } from "@/config/app-config";

const globalDb = globalThis as typeof globalThis & {
  __stockHunterDb?: DatabaseSync;
};

function resolveDbPath() {
  return path.isAbsolute(appConfig.dbPath)
    ? appConfig.dbPath
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), appConfig.dbPath);
}

function applyPragmas(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
    PRAGMA busy_timeout = 3000;
  `);
}

function createDb() {
  const resolvedPath = resolveDbPath();
  mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const db = new DatabaseSync(resolvedPath);
  applyPragmas(db);
  return db;
}

export function getDb() {
  if (!globalDb.__stockHunterDb) {
    globalDb.__stockHunterDb = createDb();
  }

  return globalDb.__stockHunterDb;
}

export function closeDb() {
  if (globalDb.__stockHunterDb) {
    globalDb.__stockHunterDb.close();
    delete globalDb.__stockHunterDb;
  }
}

export function getResolvedDbPath() {
  return resolveDbPath();
}
