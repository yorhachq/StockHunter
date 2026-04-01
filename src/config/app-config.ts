import { z } from "zod";

const appConfigSchema = z.object({
  // 页面展示名称。
  appName: z.string().min(1),
  // 数据库存储目录，使用相对路径时会相对于项目根目录解析。
  dbDir: z.string().min(1),
  // 首次启动时是否自动写入演示数据。
  autoSeed: z.boolean(),
});

const rawConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "StockHunter",
  dbDir: process.env.STOCKHUNTER_DB_DIR ?? "./data/stockhunter-db",
  autoSeed: (process.env.STOCKHUNTER_AUTO_SEED ?? "false").toLowerCase() === "true",
};

export const appConfig = appConfigSchema.parse(rawConfig);
