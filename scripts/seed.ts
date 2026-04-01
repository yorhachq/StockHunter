import { seedDemoData } from "../src/lib/db/repository";

const instrumentId = await seedDemoData();
console.log(`演示数据已准备完成，默认跳转标的 ID：${instrumentId ?? "无"}`);
