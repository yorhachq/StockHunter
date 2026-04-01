CREATE TABLE IF NOT EXISTS instruments (
  id TEXT PRIMARY KEY,
  symbol VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  market VARCHAR(32) NOT NULL,
  asset_type VARCHAR(16) NOT NULL CHECK (asset_type IN ('STOCK', 'FUND', 'ETF', 'BOND')),
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  notes TEXT,
  target_position_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  max_position_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  buy_step_ratio NUMERIC(8, 4) NOT NULL DEFAULT 0.04,
  sell_step_ratio NUMERIC(8, 4) NOT NULL DEFAULT 0.06,
  rebound_ratio NUMERIC(8, 4) NOT NULL DEFAULT 0.03,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market)
);
COMMENT ON TABLE instruments IS '交易标的主表，用于存放基金、股票、ETF 等可跟踪资产的基础信息与策略参数。';
COMMENT ON COLUMN instruments.id IS '主键，使用 UUID 字符串。';
COMMENT ON COLUMN instruments.symbol IS '交易代码，例如 513100 或 AAPL。';
COMMENT ON COLUMN instruments.name IS '标的名称，用于页面展示和复盘检索。';
COMMENT ON COLUMN instruments.market IS '所属市场，例如 CN、US、HK。';
COMMENT ON COLUMN instruments.asset_type IS '资产类型，用于区分股票、基金、ETF、债券。';
COMMENT ON COLUMN instruments.currency IS '计价币种，默认 CNY。';
COMMENT ON COLUMN instruments.notes IS '标的层面的长期备注，例如投资逻辑、风险点。';
COMMENT ON COLUMN instruments.target_position_amount IS '目标持仓金额，用于衡量当前仓位离理想仓位的差距。';
COMMENT ON COLUMN instruments.max_position_amount IS '最大允许持仓金额，用于约束加仓上限与风控阈值。';
COMMENT ON COLUMN instruments.buy_step_ratio IS '分批买入步长比例，例如 0.04 表示每次较成本线下移 4% 观察加仓。';
COMMENT ON COLUMN instruments.sell_step_ratio IS '分批卖出步长比例，例如 0.06 表示每次较成本线上移 6% 观察止盈。';
COMMENT ON COLUMN instruments.rebound_ratio IS '触发抄底后要求确认反弹的比例，用于避免一路下跌中盲目接飞刀。';
COMMENT ON COLUMN instruments.created_at IS '记录创建时间。';
COMMENT ON COLUMN instruments.updated_at IS '记录最后更新时间。';

CREATE TABLE IF NOT EXISTS trade_records (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  trade_type VARCHAR(16) NOT NULL CHECK (trade_type IN ('BUY', 'SELL', 'DIVIDEND', 'BONUS')),
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  price NUMERIC(18, 4) NOT NULL DEFAULT 0,
  fee NUMERIC(18, 4) NOT NULL DEFAULT 0,
  tax NUMERIC(18, 4) NOT NULL DEFAULT 0,
  cash_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
  reason VARCHAR(120),
  thesis TEXT,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE trade_records IS '交易流水表，记录买入、卖出、分红、送股等操作，是持仓成本与复盘分析的核心事实来源。';
COMMENT ON COLUMN trade_records.id IS '主键，使用 UUID 字符串。';
COMMENT ON COLUMN trade_records.instrument_id IS '关联交易标的主表。';
COMMENT ON COLUMN trade_records.trade_date IS '实际发生交易或到账的日期。';
COMMENT ON COLUMN trade_records.trade_type IS '交易类型：BUY 买入、SELL 卖出、DIVIDEND 现金分红、BONUS 送股。';
COMMENT ON COLUMN trade_records.quantity IS '成交数量。对于分红可填 0，对于送股填新增份额。';
COMMENT ON COLUMN trade_records.price IS '成交单价。对于现金分红可填 0。';
COMMENT ON COLUMN trade_records.fee IS '手续费等交易成本。';
COMMENT ON COLUMN trade_records.tax IS '印花税、红利税等税费。';
COMMENT ON COLUMN trade_records.cash_amount IS '额外现金金额，主要用于分红到账金额。';
COMMENT ON COLUMN trade_records.reason IS '本次交易的触发原因，例如回撤补仓、达到目标收益。';
COMMENT ON COLUMN trade_records.thesis IS '更详细的交易逻辑与复盘描述。';
COMMENT ON COLUMN trade_records.confidence IS '主观信心分，1 到 5 分，用于后续复盘对比。';
COMMENT ON COLUMN trade_records.created_at IS '记录创建时间。';

CREATE INDEX IF NOT EXISTS idx_trade_records_instrument_date
  ON trade_records (instrument_id, trade_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  close_price NUMERIC(18, 4) NOT NULL,
  high_price NUMERIC(18, 4),
  low_price NUMERIC(18, 4),
  volume NUMERIC(20, 2),
  source VARCHAR(32) NOT NULL DEFAULT 'manual',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instrument_id, snapshot_date, source)
);
COMMENT ON TABLE price_snapshots IS '价格快照表，用于手工记录每日或阶段性的价格区间，辅助评估浮盈亏与决策区间。';
COMMENT ON COLUMN price_snapshots.id IS '主键，使用 UUID 字符串。';
COMMENT ON COLUMN price_snapshots.instrument_id IS '关联交易标的主表。';
COMMENT ON COLUMN price_snapshots.snapshot_date IS '价格快照日期。';
COMMENT ON COLUMN price_snapshots.close_price IS '该日期用于决策的收盘价或参考价。';
COMMENT ON COLUMN price_snapshots.high_price IS '当日最高价，可为空。';
COMMENT ON COLUMN price_snapshots.low_price IS '当日最低价，可为空。';
COMMENT ON COLUMN price_snapshots.volume IS '成交量或份额，可按需要手工记录。';
COMMENT ON COLUMN price_snapshots.source IS '价格来源，默认 manual，便于未来扩展自动抓取。';
COMMENT ON COLUMN price_snapshots.note IS '补充说明，例如重大事件、缺口、消息面备注。';
COMMENT ON COLUMN price_snapshots.created_at IS '记录创建时间。';

CREATE INDEX IF NOT EXISTS idx_price_snapshots_instrument_date
  ON price_snapshots (instrument_id, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS review_notes (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  title VARCHAR(120) NOT NULL,
  mood VARCHAR(32),
  content TEXT NOT NULL,
  action_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE review_notes IS '复盘笔记表，用于记录每次关键交易后的判断、情绪状态、经验总结和后续计划。';
COMMENT ON COLUMN review_notes.id IS '主键，使用 UUID 字符串。';
COMMENT ON COLUMN review_notes.instrument_id IS '关联交易标的主表。';
COMMENT ON COLUMN review_notes.review_date IS '复盘对应日期。';
COMMENT ON COLUMN review_notes.title IS '复盘标题，便于列表快速识别。';
COMMENT ON COLUMN review_notes.mood IS '情绪标签，例如冷静、犹豫、激进。';
COMMENT ON COLUMN review_notes.content IS '复盘正文，描述判断是否合理、哪里做得好或不好。';
COMMENT ON COLUMN review_notes.action_plan IS '下一步行动，例如等待回撤、减仓、继续观察。';
COMMENT ON COLUMN review_notes.created_at IS '记录创建时间。';

CREATE INDEX IF NOT EXISTS idx_review_notes_instrument_date
  ON review_notes (instrument_id, review_date DESC);
