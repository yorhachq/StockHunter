import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { getDb } from "@/lib/db/client";
import { ensureDatabase } from "@/lib/db/bootstrap";
import { toNumber } from "@/lib/domain/format";
import type { InstrumentRow, ReviewNoteRow, SnapshotRow, TradeRow } from "@/lib/domain/types";

interface InstrumentInput {
  symbol: string;
  name: string;
  market: string;
  assetType: string;
  currency: string;
  notes?: string;
  targetPositionAmount: number;
  maxPositionAmount: number;
  buyStepRatio: number;
  sellStepRatio: number;
  reboundRatio: number;
}

interface TradeInput {
  instrumentId: string;
  tradeDate: string;
  tradeType: string;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  cashAmount: number;
  reason?: string;
  thesis?: string;
  confidence?: number | null;
}

interface SnapshotInput {
  instrumentId: string;
  snapshotDate: string;
  closePrice: number;
  highPrice?: number | null;
  lowPrice?: number | null;
  volume?: number | null;
  source?: string;
  note?: string;
}

interface ReviewInput {
  instrumentId: string;
  reviewDate: string;
  title: string;
  mood?: string;
  content: string;
  actionPlan?: string;
}

function mapInstrument(row: Record<string, unknown>): InstrumentRow {
  return {
    id: String(row.id),
    symbol: String(row.symbol),
    name: String(row.name),
    market: String(row.market),
    asset_type: row.asset_type as InstrumentRow["asset_type"],
    currency: String(row.currency),
    notes: row.notes ? String(row.notes) : null,
    target_position_amount: toNumber(row.target_position_amount),
    max_position_amount: toNumber(row.max_position_amount),
    buy_step_ratio: toNumber(row.buy_step_ratio),
    sell_step_ratio: toNumber(row.sell_step_ratio),
    rebound_ratio: toNumber(row.rebound_ratio),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapTrade(row: Record<string, unknown>): TradeRow {
  return {
    id: String(row.id),
    instrument_id: String(row.instrument_id),
    trade_date: String(row.trade_date),
    trade_type: row.trade_type as TradeRow["trade_type"],
    quantity: toNumber(row.quantity),
    price: toNumber(row.price),
    fee: toNumber(row.fee),
    tax: toNumber(row.tax),
    cash_amount: toNumber(row.cash_amount),
    reason: row.reason ? String(row.reason) : null,
    thesis: row.thesis ? String(row.thesis) : null,
    confidence: row.confidence ? toNumber(row.confidence) : null,
    created_at: String(row.created_at),
  };
}

function mapSnapshot(row: Record<string, unknown>): SnapshotRow {
  return {
    id: String(row.id),
    instrument_id: String(row.instrument_id),
    snapshot_date: String(row.snapshot_date),
    close_price: toNumber(row.close_price),
    high_price: row.high_price === null ? null : toNumber(row.high_price),
    low_price: row.low_price === null ? null : toNumber(row.low_price),
    volume: row.volume === null ? null : toNumber(row.volume),
    source: String(row.source),
    note: row.note ? String(row.note) : null,
    created_at: String(row.created_at),
  };
}

function mapReview(row: Record<string, unknown>): ReviewNoteRow {
  return {
    id: String(row.id),
    instrument_id: String(row.instrument_id),
    review_date: String(row.review_date),
    title: String(row.title),
    mood: row.mood ? String(row.mood) : null,
    content: String(row.content),
    action_plan: row.action_plan ? String(row.action_plan) : null,
    created_at: String(row.created_at),
  };
}

export async function getDashboardData() {
  await ensureDatabase();
  const db = await getDb();

  const [instrumentResult, tradeResult, snapshotResult, reviewResult] = await Promise.all([
    db.query("SELECT * FROM instruments ORDER BY updated_at DESC, created_at DESC"),
    db.query("SELECT * FROM trade_records ORDER BY trade_date ASC, created_at ASC"),
    db.query("SELECT * FROM price_snapshots ORDER BY snapshot_date ASC, created_at ASC"),
    db.query("SELECT * FROM review_notes ORDER BY review_date DESC, created_at DESC"),
  ]);

  return {
    instruments: instrumentResult.rows.map((row) => mapInstrument(row as Record<string, unknown>)),
    trades: tradeResult.rows.map((row) => mapTrade(row as Record<string, unknown>)),
    snapshots: snapshotResult.rows.map((row) => mapSnapshot(row as Record<string, unknown>)),
    reviews: reviewResult.rows.map((row) => mapReview(row as Record<string, unknown>)),
  };
}

export async function createInstrument(input: InstrumentInput) {
  await ensureDatabase();
  const db = await getDb();
  const id = randomUUID();

  await db.query(
    `INSERT INTO instruments (
      id, symbol, name, market, asset_type, currency, notes,
      target_position_amount, max_position_amount, buy_step_ratio, sell_step_ratio, rebound_ratio,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
    [
      id,
      input.symbol.trim().toUpperCase(),
      input.name.trim(),
      input.market.trim().toUpperCase(),
      input.assetType,
      input.currency.trim().toUpperCase(),
      input.notes?.trim() || null,
      input.targetPositionAmount,
      input.maxPositionAmount,
      input.buyStepRatio,
      input.sellStepRatio,
      input.reboundRatio,
    ],
  );

  return id;
}

export async function createTrade(input: TradeInput) {
  await ensureDatabase();
  const db = await getDb();

  await db.query(
    `INSERT INTO trade_records (
      id, instrument_id, trade_date, trade_type, quantity, price, fee, tax, cash_amount, reason, thesis, confidence, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
    [
      randomUUID(),
      input.instrumentId,
      input.tradeDate,
      input.tradeType,
      input.quantity,
      input.price,
      input.fee,
      input.tax,
      input.cashAmount,
      input.reason?.trim() || null,
      input.thesis?.trim() || null,
      input.confidence ?? null,
    ],
  );
}

export async function createSnapshot(input: SnapshotInput) {
  await ensureDatabase();
  const db = await getDb();

  await db.query(
    `INSERT INTO price_snapshots (
      id, instrument_id, snapshot_date, close_price, high_price, low_price, volume, source, note, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      randomUUID(),
      input.instrumentId,
      input.snapshotDate,
      input.closePrice,
      input.highPrice ?? null,
      input.lowPrice ?? null,
      input.volume ?? null,
      input.source?.trim() || "manual",
      input.note?.trim() || null,
    ],
  );
}

export async function createReviewNote(input: ReviewInput) {
  await ensureDatabase();
  const db = await getDb();

  await db.query(
    `INSERT INTO review_notes (
      id, instrument_id, review_date, title, mood, content, action_plan, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      randomUUID(),
      input.instrumentId,
      input.reviewDate,
      input.title.trim(),
      input.mood?.trim() || null,
      input.content.trim(),
      input.actionPlan?.trim() || null,
    ],
  );
}

async function seedDemoDataWithDb(db: PGlite) {
  const countResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM instruments");
  if ((countResult.rows[0]?.count ?? 0) > 0) {
    const first = await db.query<{ id: string }>("SELECT id FROM instruments ORDER BY created_at ASC LIMIT 1");
    return first.rows[0]?.id ?? null;
  }

  const instrumentA = randomUUID();
  const instrumentB = randomUUID();

  await db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO instruments (
        id, symbol, name, market, asset_type, currency, notes,
        target_position_amount, max_position_amount, buy_step_ratio, sell_step_ratio, rebound_ratio,
        created_at, updated_at
      ) VALUES
      ($1, '513100', '纳指 ETF', 'CN', 'ETF', 'CNY', '核心成长仓位，优先按回撤阶梯分批布局。', 60000, 80000, 0.04, 0.08, 0.025, NOW(), NOW()),
      ($2, '159915', '创业板 ETF', 'CN', 'ETF', 'CNY', '高波动观察仓，重点关注情绪化回撤后的修复机会。', 30000, 45000, 0.05, 0.1, 0.03, NOW(), NOW())`,
      [instrumentA, instrumentB],
    );

    await tx.query(
      `INSERT INTO trade_records (
        id, instrument_id, trade_date, trade_type, quantity, price, fee, tax, cash_amount, reason, thesis, confidence, created_at
      ) VALUES
      ($1, $9, '2025-11-12', 'BUY', 3000, 1.1080, 3.20, 0, 0, '首次建仓', '指数回撤接近中期通道下沿，先建立 40% 观察仓位。', 4, NOW()),
      ($2, $9, '2025-12-18', 'BUY', 2500, 1.0320, 2.90, 0, 0, '回撤补仓', '价格跌破前低后出现缩量企稳，按计划补第二笔。', 4, NOW()),
      ($3, $9, '2026-01-26', 'SELL', 1800, 1.1960, 3.20, 2.15, 0, '兑现盈利', '短期涨幅偏大，先回收一部分仓位降低波动。', 3, NOW()),
      ($4, $9, '2026-02-20', 'DIVIDEND', 0, 0, 0, 0.68, 120, '分红到账', '分红直接计入现金收益。', 5, NOW()),
      ($5, $10, '2025-10-08', 'BUY', 2200, 1.5620, 3.00, 0, 0, '趋势试错', '放量突破后尝试轻仓参与。', 3, NOW()),
      ($6, $10, '2026-02-06', 'BUY', 1800, 1.3880, 2.60, 0, 0, '深跌加仓', '情绪杀跌接近历史密集成交区，按预案补仓。', 4, NOW())`,
      [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID(), instrumentA, instrumentB],
    );

    await tx.query(
      `INSERT INTO price_snapshots (
        id, instrument_id, snapshot_date, close_price, high_price, low_price, volume, source, note, created_at
      ) VALUES
      ($1, $7, '2025-11-12', 1.1080, 1.1120, 1.0950, 1280000, 'manual', '首次建仓日', NOW()),
      ($2, $7, '2025-12-18', 1.0320, 1.0400, 1.0180, 1540000, 'manual', '第二笔补仓', NOW()),
      ($3, $7, '2026-01-26', 1.1960, 1.2050, 1.1740, 1320000, 'manual', '触及阶段目标位', NOW()),
      ($4, $7, '2026-03-31', 1.1520, 1.1680, 1.1410, 1180000, 'manual', '最新观察价', NOW()),
      ($5, $8, '2025-10-08', 1.5620, 1.5800, 1.5310, 950000, 'manual', '首次试错', NOW()),
      ($6, $8, '2026-02-06', 1.3880, 1.4020, 1.3440, 1430000, 'manual', '第二笔加仓', NOW()),
      ($7, $8, '2026-03-31', 1.4760, 1.4890, 1.4520, 1270000, 'manual', '最新观察价', NOW())`,
      [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID(), instrumentA, instrumentB],
    );

    await tx.query(
      `INSERT INTO review_notes (
        id, instrument_id, review_date, title, mood, content, action_plan, created_at
      ) VALUES
      ($1, $4, '2026-01-27', '纳指 ETF 止盈复盘', '克制', '这次卖出遵守了预设的分批兑现策略，没有在利润扩大后继续贪婪追高。下一次要进一步细化卖出前后的回撤保护规则。', '若再次上冲并放量，可在剩余仓位中继续兑现 20%。', NOW()),
      ($2, $5, '2026-02-07', '创业板 ETF 补仓复盘', '冷静', '补仓前已经设定了最大仓位限制，执行过程没有失控。需要持续跟踪是否出现二次探底。', '若价格跌破 1.34 且量能放大，暂停加仓，等待反弹确认。', NOW())`,
      [randomUUID(), randomUUID(), instrumentA, instrumentB],
    );
  });

  return instrumentA;
}

export async function seedDemoData() {
  await ensureDatabase();
  const db = await getDb();
  return seedDemoDataWithDb(db);
}

export async function seedDemoDataOnBoot() {
  const db = await getDb();
  return seedDemoDataWithDb(db);
}

export async function resetDatabase() {
  const db = await getDb();
  await db.exec(`
    DROP TABLE IF EXISTS review_notes;
    DROP TABLE IF EXISTS price_snapshots;
    DROP TABLE IF EXISTS trade_records;
    DROP TABLE IF EXISTS instruments;
  `);
}
