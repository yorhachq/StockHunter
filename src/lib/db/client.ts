import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { appConfig } from "@/config/app-config";

const globalDb = globalThis as typeof globalThis & {
  __stockHunterDb?: Promise<PGlite>;
};

async function createDb() {
  const resolvedDir = path.isAbsolute(appConfig.dbDir)
    ? appConfig.dbDir
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), appConfig.dbDir);
  await mkdir(resolvedDir, { recursive: true });
  const db = new PGlite(resolvedDir);
  await db.waitReady;
  return db;
}

export function getDb() {
  if (!globalDb.__stockHunterDb) {
    globalDb.__stockHunterDb = createDb();
  }

  return globalDb.__stockHunterDb;
}
