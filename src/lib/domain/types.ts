export const assetTypes = ["STOCK", "FUND", "ETF", "BOND"] as const;
export const tradeTypes = ["BUY", "SELL", "DIVIDEND", "BONUS"] as const;

export type AssetType = (typeof assetTypes)[number];
export type TradeType = (typeof tradeTypes)[number];

// 基础数据表结构映射。
export interface InstrumentRow {
  id: string;
  symbol: string;
  name: string;
  market: string;
  asset_type: AssetType;
  currency: string;
  notes: string | null;
  target_position_amount: number;
  max_position_amount: number;
  buy_step_ratio: number;
  sell_step_ratio: number;
  rebound_ratio: number;
  created_at: string;
  updated_at: string;
}

export interface TradeRow {
  id: string;
  instrument_id: string;
  trade_date: string;
  trade_type: TradeType;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  cash_amount: number;
  reason: string | null;
  thesis: string | null;
  confidence: number | null;
  created_at: string;
}

export interface SnapshotRow {
  id: string;
  instrument_id: string;
  snapshot_date: string;
  close_price: number;
  high_price: number | null;
  low_price: number | null;
  volume: number | null;
  source: string;
  note: string | null;
  created_at: string;
}

export interface ReviewNoteRow {
  id: string;
  instrument_id: string;
  review_date: string;
  title: string;
  mood: string | null;
  content: string;
  action_plan: string | null;
  created_at: string;
}

export interface StrategyZone {
  low: number;
  high: number;
  label: string;
}

export interface DecisionSuggestion {
  status: "WATCH" | "BUY_ZONE" | "SELL_ZONE" | "HOLD";
  headline: string;
  detail: string;
  action: string;
  buyZone: StrategyZone;
  sellZone: StrategyZone;
  positionUsage: number;
}

export interface ChartPoint {
  date: string;
  price: number | null;
  avgCost: number | null;
  quantity: number;
  realizedPnl: number;
  trades: TradeRow[];
}

export interface PortfolioContribution {
  marketValueRatio: number | null;
  costBasisRatio: number | null;
  unrealizedPnlRatio: number | null;
  realizedPnlRatio: number | null;
  quantityRatio: number | null;
}

export interface InstrumentAnalytics {
  instrument: InstrumentRow;
  trades: TradeRow[];
  snapshots: SnapshotRow[];
  reviews: ReviewNoteRow[];
  currentPrice: number | null;
  quantityHeld: number;
  averageCost: number;
  costBasis: number;
  realizedPnl: number;
  unrealizedPnl: number | null;
  dividendIncome: number;
  feesAndTaxes: number;
  marketValue: number | null;
  breakEvenPrice: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  lastTrade: TradeRow | null;
  lastSnapshot: SnapshotRow | null;
  chartPoints: ChartPoint[];
  contribution: PortfolioContribution;
  suggestion: DecisionSuggestion;
}

export interface PortfolioOverview {
  analyticsList: InstrumentAnalytics[];
  selected: InstrumentAnalytics | null;
  totals: {
    marketValue: number;
    costBasis: number;
    realizedPnl: number;
    unrealizedPnl: number;
    dividendIncome: number;
    quantityHeld: number;
  };
}
