import { clamp } from "@/lib/domain/format";
import type {
  ChartPoint,
  InstrumentAnalytics,
  InstrumentRow,
  PortfolioContribution,
  PortfolioOverview,
  ReviewNoteRow,
  SnapshotRow,
  TradeRow,
} from "@/lib/domain/types";

interface BuildOverviewInput {
  instruments: InstrumentRow[];
  trades: TradeRow[];
  snapshots: SnapshotRow[];
  reviews: ReviewNoteRow[];
  selectedInstrumentId?: string | null;
}

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function ratioOf(value: number | null, total: number) {
  if (value === null || total === 0) {
    return null;
  }

  return round(value / total, 4);
}

function buildContribution(
  item: InstrumentAnalytics,
  totals: PortfolioOverview["totals"],
): PortfolioContribution {
  return {
    marketValueRatio: ratioOf(item.marketValue, totals.marketValue),
    costBasisRatio: ratioOf(item.costBasis, totals.costBasis),
    unrealizedPnlRatio: ratioOf(item.unrealizedPnl, totals.unrealizedPnl),
    realizedPnlRatio: ratioOf(item.realizedPnl, totals.realizedPnl),
    quantityRatio: ratioOf(item.quantityHeld, totals.quantityHeld),
  };
}

function buildInstrumentAnalytics(
  instrument: InstrumentRow,
  trades: TradeRow[],
  snapshots: SnapshotRow[],
  reviews: ReviewNoteRow[],
): InstrumentAnalytics {
  const sortedTrades = [...trades].sort((left, right) => {
    if (left.trade_date === right.trade_date) {
      return left.created_at.localeCompare(right.created_at);
    }
    return left.trade_date.localeCompare(right.trade_date);
  });
  const sortedSnapshots = [...snapshots].sort((left, right) => left.snapshot_date.localeCompare(right.snapshot_date));

  let quantityHeld = 0;
  let costBasis = 0;
  let realizedPnl = 0;
  let dividendIncome = 0;
  let feesAndTaxes = 0;
  let totalBuyAmount = 0;
  let totalSellAmount = 0;
  let totalBuyQuantity = 0;
  let totalSellQuantity = 0;

  const chartPoints: ChartPoint[] = [];
  const snapshotByDate = new Map(sortedSnapshots.map((snapshot) => [snapshot.snapshot_date, snapshot]));
  const dates = new Set<string>([
    ...sortedTrades.map((trade) => trade.trade_date),
    ...sortedSnapshots.map((snapshot) => snapshot.snapshot_date),
  ]);

  for (const trade of sortedTrades) {
    feesAndTaxes += trade.fee + trade.tax;

    if (trade.trade_type === "BUY") {
      const grossAmount = trade.quantity * trade.price + trade.fee + trade.tax;
      quantityHeld += trade.quantity;
      costBasis += grossAmount;
      totalBuyAmount += grossAmount;
      totalBuyQuantity += trade.quantity;
    }

    if (trade.trade_type === "SELL") {
      const avgCostBeforeSell = quantityHeld > 0 ? costBasis / quantityHeld : 0;
      const reductionCost = avgCostBeforeSell * trade.quantity;
      const netSellAmount = trade.quantity * trade.price - trade.fee - trade.tax;
      quantityHeld = Math.max(0, quantityHeld - trade.quantity);
      costBasis = Math.max(0, costBasis - reductionCost);
      realizedPnl += netSellAmount - reductionCost;
      totalSellAmount += netSellAmount;
      totalSellQuantity += trade.quantity;
      if (quantityHeld === 0) {
        costBasis = 0;
      }
    }

    if (trade.trade_type === "DIVIDEND") {
      const netDividend = trade.cash_amount - trade.fee - trade.tax;
      dividendIncome += netDividend;
      realizedPnl += netDividend;
    }

    if (trade.trade_type === "BONUS") {
      quantityHeld += trade.quantity;
    }
  }

  const tradeMap = new Map<string, TradeRow[]>();
  for (const trade of sortedTrades) {
    const list = tradeMap.get(trade.trade_date) ?? [];
    list.push(trade);
    tradeMap.set(trade.trade_date, list);
  }

  quantityHeld = 0;
  costBasis = 0;
  realizedPnl = 0;
  dividendIncome = 0;

  for (const date of [...dates].sort()) {
    const dailyTrades = tradeMap.get(date) ?? [];
    for (const trade of dailyTrades) {
      if (trade.trade_type === "BUY") {
        quantityHeld += trade.quantity;
        costBasis += trade.quantity * trade.price + trade.fee + trade.tax;
      }

      if (trade.trade_type === "SELL") {
        const avgCostBeforeSell = quantityHeld > 0 ? costBasis / quantityHeld : 0;
        const reductionCost = avgCostBeforeSell * trade.quantity;
        const netSellAmount = trade.quantity * trade.price - trade.fee - trade.tax;
        quantityHeld = Math.max(0, quantityHeld - trade.quantity);
        costBasis = Math.max(0, costBasis - reductionCost);
        realizedPnl += netSellAmount - reductionCost;
        if (quantityHeld === 0) {
          costBasis = 0;
        }
      }

      if (trade.trade_type === "DIVIDEND") {
        realizedPnl += trade.cash_amount - trade.fee - trade.tax;
        dividendIncome += trade.cash_amount - trade.fee - trade.tax;
      }

      if (trade.trade_type === "BONUS") {
        quantityHeld += trade.quantity;
      }
    }

    chartPoints.push({
      date,
      price: snapshotByDate.get(date)?.close_price ?? null,
      avgCost: quantityHeld > 0 ? costBasis / quantityHeld : null,
      quantity: round(quantityHeld),
      realizedPnl: round(realizedPnl, 2),
      trades: dailyTrades,
    });
  }

  const currentPrice = sortedSnapshots.at(-1)?.close_price ?? null;
  const quantityNow = chartPoints.at(-1)?.quantity ?? 0;
  const costBasisNow = quantityNow > 0 ? round((chartPoints.at(-1)?.avgCost ?? 0) * quantityNow, 2) : 0;
  const averageCost = quantityNow > 0 ? round(costBasisNow / quantityNow, 4) : 0;
  const marketValue = currentPrice !== null ? round(currentPrice * quantityNow, 2) : null;
  const unrealizedPnl = currentPrice !== null ? round(currentPrice * quantityNow - costBasisNow, 2) : null;
  const buyPrices = sortedTrades.filter((item) => item.trade_type === "BUY").map((item) => item.price);
  const sellPrices = sortedTrades.filter((item) => item.trade_type === "SELL").map((item) => item.price);
  const referencePrices = [
    ...sortedSnapshots.map((item) => item.close_price),
    ...buyPrices,
    ...sellPrices,
  ].filter((item) => item > 0);
  const priceVolatility = referencePrices.length > 0 ? standardDeviation(referencePrices) / (referencePrices.reduce((a, b) => a + b, 0) / referencePrices.length) : 0.03;

  const buyBase = averageCost > 0 ? averageCost : sortedSnapshots.at(-1)?.close_price ?? buyPrices.at(-1) ?? 0;
  const sellBase = averageCost > 0 ? averageCost : currentPrice ?? buyBase;
  const buyZoneLow = round(buyBase * (1 - instrument.buy_step_ratio - priceVolatility * 0.6), 4);
  const buyZoneHigh = round(buyBase * (1 - Math.max(instrument.buy_step_ratio / 2, 0.015)), 4);
  const sellZoneLow = round(sellBase * (1 + instrument.sell_step_ratio), 4);
  const sellZoneHigh = round(sellZoneLow * (1 + Math.max(priceVolatility, 0.025)), 4);
  const positionUsage = instrument.max_position_amount > 0 && marketValue !== null ? clamp(marketValue / instrument.max_position_amount, 0, 1.6) : 0;

  let status: InstrumentAnalytics["suggestion"]["status"] = "WATCH";
  let headline = "等待更清晰的价格信号";
  let detail = "当前价格处在策略中性区间，适合继续观察仓位、量能与大盘环境。";
  let action = "保持记录，暂不追单。";

  if (currentPrice !== null && currentPrice <= buyZoneHigh) {
    status = "BUY_ZONE";
    headline = currentPrice <= buyZoneLow ? "进入强关注补仓带" : "接近计划买入区间";
    detail = "当前价格已回落至成本线下方，结合步长参数与波动率，适合按计划分批试探，不要一次性打满仓位。";
    action = positionUsage >= 1 ? "仓位已接近上限，优先等待确认反弹。" : `可先投入剩余仓位的 ${positionUsage < 0.5 ? "20%~30%" : "10%~15%"}。`;
  } else if (currentPrice !== null && currentPrice >= sellZoneLow) {
    status = "SELL_ZONE";
    headline = currentPrice >= sellZoneHigh ? "达到偏热兑现区间" : "进入分批止盈区间";
    detail = "价格已经明显高于平均成本，继续上涨当然可能发生，但赔率优势正在下降，更适合按纪律锁定收益。";
    action = quantityNow > 0 ? "可先兑现 20%~30%，将主动权重新拿回自己手里。" : "当前没有持仓，无需执行卖出。";
  } else if (quantityNow > 0) {
    status = "HOLD";
    headline = "仓位结构相对健康";
    detail = "价格暂未触达买卖关键带，持仓以等待趋势验证为主，继续记录新的价格快照。";
    action = "关注是否出现放量突破或跌破支撑。";
  }

  return {
    instrument,
    trades: sortedTrades.slice().reverse(),
    snapshots: sortedSnapshots.slice().reverse(),
    reviews,
    currentPrice,
    quantityHeld: round(quantityNow),
    averageCost,
    costBasis: round(costBasisNow, 2),
    realizedPnl: round(chartPoints.at(-1)?.realizedPnl ?? 0, 2),
    unrealizedPnl,
    dividendIncome: round(dividendIncome, 2),
    feesAndTaxes: round(feesAndTaxes, 2),
    marketValue,
    breakEvenPrice: averageCost,
    totalBuyAmount: round(totalBuyAmount, 2),
    totalSellAmount: round(totalSellAmount, 2),
    totalBuyQuantity: round(totalBuyQuantity),
    totalSellQuantity: round(totalSellQuantity),
    lastTrade: sortedTrades.at(-1) ?? null,
    lastSnapshot: sortedSnapshots.at(-1) ?? null,
    chartPoints,
    contribution: {
      marketValueRatio: null,
      costBasisRatio: null,
      unrealizedPnlRatio: null,
      realizedPnlRatio: null,
      quantityRatio: null,
    },
    suggestion: {
      status,
      headline,
      detail,
      action,
      buyZone: { low: buyZoneLow, high: buyZoneHigh, label: "计划买入带" },
      sellZone: { low: sellZoneLow, high: sellZoneHigh, label: "计划卖出带" },
      positionUsage,
    },
  };
}

export function buildPortfolioOverview(input: BuildOverviewInput): PortfolioOverview {
  const analyticsSeed = input.instruments.map((instrument) =>
    buildInstrumentAnalytics(
      instrument,
      input.trades.filter((trade) => trade.instrument_id === instrument.id),
      input.snapshots.filter((snapshot) => snapshot.instrument_id === instrument.id),
      input.reviews.filter((review) => review.instrument_id === instrument.id),
    ),
  );

  const totals = {
    marketValue: round(analyticsSeed.reduce((sum, item) => sum + (item.marketValue ?? 0), 0), 2),
    costBasis: round(analyticsSeed.reduce((sum, item) => sum + item.costBasis, 0), 2),
    realizedPnl: round(analyticsSeed.reduce((sum, item) => sum + item.realizedPnl, 0), 2),
    unrealizedPnl: round(analyticsSeed.reduce((sum, item) => sum + (item.unrealizedPnl ?? 0), 0), 2),
    dividendIncome: round(analyticsSeed.reduce((sum, item) => sum + item.dividendIncome, 0), 2),
    quantityHeld: round(analyticsSeed.reduce((sum, item) => sum + item.quantityHeld, 0), 4),
  };

  const analyticsList = analyticsSeed.map((item) => ({
    ...item,
    contribution: buildContribution(item, totals),
  }));

  const selected = analyticsList.find((item) => item.instrument.id === input.selectedInstrumentId) ?? analyticsList[0] ?? null;

  return {
    analyticsList,
    selected,
    totals,
  };
}
