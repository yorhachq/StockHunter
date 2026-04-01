import { z } from "zod";

const appConfigSchema = z.object({
  // 页面展示名称。
  appName: z.string().min(1),
  // SQLite 数据库文件路径，使用相对路径时会相对于项目根目录解析。
  dbPath: z.string().min(1),
  // 首次启动时是否自动写入演示数据。
  autoSeed: z.boolean(),
});

const rawConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "StockHunter",
  dbPath: process.env.STOCKHUNTER_DB_PATH ?? "./data/stockhunter.sqlite",
  autoSeed: (process.env.STOCKHUNTER_AUTO_SEED ?? "false").toLowerCase() === "true",
};

export const appConfig = appConfigSchema.parse(rawConfig);
