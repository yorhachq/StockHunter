import { readFileSync } from "node:fs";
import path from "node:path";
import { appConfig } from "@/config/app-config";
import { getDb } from "@/lib/db/client";

const globalBootstrap = globalThis as typeof globalThis & {
  __stockHunterBootstrap?: Promise<void>;
};

export async function ensureDatabase() {
  if (!globalBootstrap.__stockHunterBootstrap) {
    globalBootstrap.__stockHunterBootstrap = (async () => {
      const db = getDb();
      const schemaPath = path.join(/* turbopackIgnore: true */ process.cwd(), "src", "lib", "db", "schema.sql");
      const schemaSql = readFileSync(schemaPath, "utf8");
      db.exec(schemaSql);

      if (appConfig.autoSeed) {
        const result = db.prepare("SELECT COUNT(*) AS count FROM instruments").get() as { count: number } | undefined;
        if ((result?.count ?? 0) === 0) {
          const { seedDemoDataOnBoot } = await import("@/lib/db/repository");
          await seedDemoDataOnBoot();
        }
      }
    })();
  }

  return globalBootstrap.__stockHunterBootstrap;
}
