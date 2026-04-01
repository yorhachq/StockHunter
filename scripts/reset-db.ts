import { ensureDatabase } from "../src/lib/db/bootstrap";
import { resetDatabase } from "../src/lib/db/repository";

await ensureDatabase();
await resetDatabase();
console.log("数据库表已清空，可重新执行 pnpm db:seed 写入演示数据。");
