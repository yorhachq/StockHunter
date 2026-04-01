import { closeDb } from "../src/lib/db/client";
import { seedDemoData } from "../src/lib/db/repository";

async function main() {
  try {
    const instrumentId = await seedDemoData();
    console.log(`演示数据已准备完成，默认跳转标的 ID：${instrumentId ?? "无"}`);
  } finally {
    closeDb();
  }
}

main().catch((error) => {
  console.error("写入演示数据失败：", error);
  process.exit(1);
});
