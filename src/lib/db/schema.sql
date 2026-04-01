PRAGMA foreign_keys = ON;

-- 表：交易标的主表。
-- 用途：存放基金、股票、ETF 等可跟踪资产的基础信息与策略参数。
CREATE TABLE IF NOT EXISTS instruments (
  -- 主键，使用 UUID 字符串。
  id TEXT PRIMARY KEY,
  -- 交易代码，例如 513100 或 AAPL。
  symbol TEXT NOT NULL,
  -- 标的名称，用于页面展示和复盘检索。
  name TEXT NOT NULL,
  -- 所属市场，例如 CN、US、HK。
  market TEXT NOT NULL,
  -- 资产类型，用于区分股票、基金、ETF、债券。
  asset_type TEXT NOT NULL CHECK (asset_type IN ('STOCK', 'FUND', 'ETF', 'BOND')),
  -- 计价币种，默认 CNY。
  currency TEXT NOT NULL DEFAULT 'CNY',
  -- 标的层面的长期备注，例如投资逻辑、风险点。
  notes TEXT,
  -- 目标持仓金额，用于衡量当前仓位离理想仓位的差距。
  target_position_amount REAL NOT NULL DEFAULT 0,
  -- 最大允许持仓金额，用于约束加仓上限与风控阈值。
  max_position_amount REAL NOT NULL DEFAULT 0,
  -- 分批买入步长比例，例如 0.04 表示每次较成本线下移 4% 观察加仓。
  buy_step_ratio REAL NOT NULL DEFAULT 0.04,
  -- 分批卖出步长比例，例如 0.06 表示每次较成本线上移 6% 观察止盈。
  sell_step_ratio REAL NOT NULL DEFAULT 0.06,
  -- 触发抄底后要求确认反弹的比例，用于避免一路下跌中盲目接飞刀。
  rebound_ratio REAL NOT NULL DEFAULT 0.03,
  -- 记录创建时间。
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- 记录最后更新时间。
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (symbol, market)
);

CREATE INDEX IF NOT EXISTS idx_instruments_updated_at
  ON instruments (updated_at DESC, created_at DESC);

-- 表：交易流水表。
-- 用途：记录买入、卖出、分红、送股等操作，是持仓成本与复盘分析的核心事实来源。
CREATE TABLE IF NOT EXISTS trade_records (
  -- 主键，使用 UUID 字符串。
  id TEXT PRIMARY KEY,
  -- 关联交易标的主表。
  instrument_id TEXT NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  -- 实际发生交易或到账的日期。
  trade_date TEXT NOT NULL,
  -- 交易类型：BUY 买入、SELL 卖出、DIVIDEND 现金分红、BONUS 送股。
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL', 'DIVIDEND', 'BONUS')),
  -- 成交数量。对于分红可填 0，对于送股填新增份额。
  quantity REAL NOT NULL DEFAULT 0,
  -- 成交单价。对于现金分红可填 0。
  price REAL NOT NULL DEFAULT 0,
  -- 手续费等交易成本。
  fee REAL NOT NULL DEFAULT 0,
  -- 印花税、红利税等税费。
  tax REAL NOT NULL DEFAULT 0,
  -- 额外现金金额，主要用于分红到账金额。
  cash_amount REAL NOT NULL DEFAULT 0,
  -- 本次交易的触发原因，例如回撤补仓、达到目标收益。
  reason TEXT,
  -- 更详细的交易逻辑与复盘描述。
  thesis TEXT,
  -- 主观信心分，1 到 5 分，用于后续复盘对比。
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  -- 记录创建时间。
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_trade_records_instrument_date
  ON trade_records (instrument_id, trade_date DESC, created_at DESC);

-- 表：价格快照表。
-- 用途：手工记录每日或阶段性的价格区间，辅助评估浮盈亏与决策区间。
CREATE TABLE IF NOT EXISTS price_snapshots (
  -- 主键，使用 UUID 字符串。
  id TEXT PRIMARY KEY,
  -- 关联交易标的主表。
  instrument_id TEXT NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  -- 价格快照日期。
  snapshot_date TEXT NOT NULL,
  -- 该日期用于决策的收盘价或参考价。
  close_price REAL NOT NULL,
  -- 当日最高价，可为空。
  high_price REAL,
  -- 当日最低价，可为空。
  low_price REAL,
  -- 成交量或份额，可按需要手工记录。
  volume REAL,
  -- 价格来源，默认 manual，便于未来扩展自动抓取。
  source TEXT NOT NULL DEFAULT 'manual',
  -- 补充说明，例如重大事件、缺口、消息面备注。
  note TEXT,
  -- 记录创建时间。
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (instrument_id, snapshot_date, source)
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_instrument_date
  ON price_snapshots (instrument_id, snapshot_date DESC);

-- 表：复盘笔记表。
-- 用途：记录每次关键交易后的判断、情绪状态、经验总结和后续计划。
CREATE TABLE IF NOT EXISTS review_notes (
  -- 主键，使用 UUID 字符串。
  id TEXT PRIMARY KEY,
  -- 关联交易标的主表。
  instrument_id TEXT NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  -- 复盘对应日期。
  review_date TEXT NOT NULL,
  -- 复盘标题，便于列表快速识别。
  title TEXT NOT NULL,
  -- 情绪标签，例如冷静、犹豫、激进。
  mood TEXT,
  -- 复盘正文，描述判断是否合理、哪里做得好或不好。
  content TEXT NOT NULL,
  -- 下一步行动，例如等待回撤、减仓、继续观察。
  action_plan TEXT,
  -- 记录创建时间。
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_review_notes_instrument_date
  ON review_notes (instrument_id, review_date DESC);

-- 表：数据字典中的表注释。
-- 用途：由于 SQLite 不支持 COMMENT ON，这里显式保存中文表注释，便于后续迁移、生成文档和管理后台展示。
CREATE TABLE IF NOT EXISTS schema_table_comments (
  table_name TEXT PRIMARY KEY,
  comment TEXT NOT NULL
);

-- 表：数据字典中的字段注释。
-- 用途：保存中文字段说明，作为 SQLite 环境下的结构化字段注释来源。
CREATE TABLE IF NOT EXISTS schema_column_comments (
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  PRIMARY KEY (table_name, column_name),
  FOREIGN KEY (table_name) REFERENCES schema_table_comments (table_name) ON DELETE CASCADE
);

INSERT OR REPLACE INTO schema_table_comments (table_name, comment) VALUES
  ('instruments', '交易标的主表，用于存放基金、股票、ETF 等可跟踪资产的基础信息与策略参数。'),
  ('trade_records', '交易流水表，记录买入、卖出、分红、送股等操作，是持仓成本与复盘分析的核心事实来源。'),
  ('price_snapshots', '价格快照表，用于手工记录每日或阶段性的价格区间，辅助评估浮盈亏与决策区间。'),
  ('review_notes', '复盘笔记表，用于记录每次关键交易后的判断、情绪状态、经验总结和后续计划。');

INSERT OR REPLACE INTO schema_column_comments (table_name, column_name, comment) VALUES
  ('instruments', 'id', '主键，使用 UUID 字符串。'),
  ('instruments', 'symbol', '交易代码，例如 513100 或 AAPL。'),
  ('instruments', 'name', '标的名称，用于页面展示和复盘检索。'),
  ('instruments', 'market', '所属市场，例如 CN、US、HK。'),
  ('instruments', 'asset_type', '资产类型，用于区分股票、基金、ETF、债券。'),
  ('instruments', 'currency', '计价币种，默认 CNY。'),
  ('instruments', 'notes', '标的层面的长期备注，例如投资逻辑、风险点。'),
  ('instruments', 'target_position_amount', '目标持仓金额，用于衡量当前仓位离理想仓位的差距。'),
  ('instruments', 'max_position_amount', '最大允许持仓金额，用于约束加仓上限与风控阈值。'),
  ('instruments', 'buy_step_ratio', '分批买入步长比例。'),
  ('instruments', 'sell_step_ratio', '分批卖出步长比例。'),
  ('instruments', 'rebound_ratio', '抄底确认反弹比例。'),
  ('instruments', 'created_at', '记录创建时间。'),
  ('instruments', 'updated_at', '记录最后更新时间。'),
  ('trade_records', 'id', '主键，使用 UUID 字符串。'),
  ('trade_records', 'instrument_id', '关联交易标的主表。'),
  ('trade_records', 'trade_date', '实际发生交易或到账的日期。'),
  ('trade_records', 'trade_type', '交易类型：BUY 买入、SELL 卖出、DIVIDEND 现金分红、BONUS 送股。'),
  ('trade_records', 'quantity', '成交数量。对于分红可填 0，对于送股填新增份额。'),
  ('trade_records', 'price', '成交单价。对于现金分红可填 0。'),
  ('trade_records', 'fee', '手续费等交易成本。'),
  ('trade_records', 'tax', '印花税、红利税等税费。'),
  ('trade_records', 'cash_amount', '额外现金金额，主要用于分红到账金额。'),
  ('trade_records', 'reason', '本次交易的触发原因，例如回撤补仓、达到目标收益。'),
  ('trade_records', 'thesis', '更详细的交易逻辑与复盘描述。'),
  ('trade_records', 'confidence', '主观信心分，1 到 5 分。'),
  ('trade_records', 'created_at', '记录创建时间。'),
  ('price_snapshots', 'id', '主键，使用 UUID 字符串。'),
  ('price_snapshots', 'instrument_id', '关联交易标的主表。'),
  ('price_snapshots', 'snapshot_date', '价格快照日期。'),
  ('price_snapshots', 'close_price', '该日期用于决策的收盘价或参考价。'),
  ('price_snapshots', 'high_price', '当日最高价，可为空。'),
  ('price_snapshots', 'low_price', '当日最低价，可为空。'),
  ('price_snapshots', 'volume', '成交量或份额，可按需要手工记录。'),
  ('price_snapshots', 'source', '价格来源，默认 manual，便于未来扩展自动抓取。'),
  ('price_snapshots', 'note', '补充说明，例如重大事件、缺口、消息面备注。'),
  ('price_snapshots', 'created_at', '记录创建时间。'),
  ('review_notes', 'id', '主键，使用 UUID 字符串。'),
  ('review_notes', 'instrument_id', '关联交易标的主表。'),
  ('review_notes', 'review_date', '复盘对应日期。'),
  ('review_notes', 'title', '复盘标题，便于列表快速识别。'),
  ('review_notes', 'mood', '情绪标签，例如冷静、犹豫、激进。'),
  ('review_notes', 'content', '复盘正文，描述判断是否合理、哪里做得好或不好。'),
  ('review_notes', 'action_plan', '下一步行动，例如等待回撤、减仓、继续观察。'),
  ('review_notes', 'created_at', '记录创建时间。');
