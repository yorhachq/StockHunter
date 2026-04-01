import { readFile } from "node:fs/promises";
import { appConfig } from "@/config/app-config";
import { getDb } from "@/lib/db/client";

const globalBootstrap = globalThis as typeof globalThis & {
  __stockHunterBootstrap?: Promise<void>;
};

export async function ensureDatabase() {
  if (!globalBootstrap.__stockHunterBootstrap) {
    globalBootstrap.__stockHunterBootstrap = (async () => {
      const db = await getDb();
      const schemaPath = new URL("./schema.sql", import.meta.url);
      const schemaSql = await readFile(schemaPath, "utf8");
      await db.exec(schemaSql);

      if (appConfig.autoSeed) {
        const result = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM instruments");
        if ((result.rows[0]?.count ?? 0) === 0) {
          const { seedDemoDataOnBoot } = await import("@/lib/db/repository");
          await seedDemoDataOnBoot();
        }
      }
    })();
  }

  return globalBootstrap.__stockHunterBootstrap;
}
