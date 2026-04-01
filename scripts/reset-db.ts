import { ensureDatabase } from "../src/lib/db/bootstrap";
import { closeDb } from "../src/lib/db/client";
import { resetDatabase } from "../src/lib/db/repository";

async function main() {
  try {
    await ensureDatabase();
    await resetDatabase();
    console.log("数据库表已清空，可重新执行 pnpm db:seed 写入演示数据。");
  } finally {
    closeDb();
  }
}

main().catch((error) => {
  console.error("重置数据库失败：", error);
  process.exit(1);
});
