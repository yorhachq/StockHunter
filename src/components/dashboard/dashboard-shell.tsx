import Link from "next/link";
import { FormsPanel } from "@/components/dashboard/forms-panel";
import { PositionHistoryChart } from "@/components/dashboard/position-history-chart";
import { PriceBandChart } from "@/components/dashboard/price-band-chart";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/domain/format";
import type { InstrumentAnalytics, PortfolioOverview, TradeRow } from "@/lib/domain/types";

function toneClass(value: number | null) {
  if (value === null || value === 0) {
    return "text-[var(--ink)]";
  }

  return value > 0 ? "text-[var(--rise)]" : "text-[var(--fall)]";
}

function statusText(analytics: InstrumentAnalytics) {
  switch (analytics.suggestion.status) {
    case "BUY_ZONE":
      return "买入关注";
    case "SELL_ZONE":
      return "卖出关注";
    case "HOLD":
      return "持有跟踪";
    default:
      return "观察中";
  }
}

function tradeTypeLabel(trade: TradeRow) {
  if (trade.trade_type === "BUY") {
    return "买入";
  }
  if (trade.trade_type === "SELL") {
    return "卖出";
  }
  if (trade.trade_type === "DIVIDEND") {
    return "分红";
  }
  return "送股";
}

function SummaryMetric({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="metric-block">
      <p className="metric-label">{label}</p>
      <p className={`metric-value ${tone ?? ""}`}>{value}</p>
      <p className="metric-hint">{hint}</p>
    </div>
  );
}

function SelectedInstrumentPanel({ analytics }: { analytics: InstrumentAnalytics }) {
  const profitRate = analytics.costBasis > 0 && analytics.unrealizedPnl !== null ? analytics.unrealizedPnl / analytics.costBasis : null;

  return (
    <section className="panel panel-hero space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span>{analytics.instrument.market}</span>
            <span>{analytics.instrument.asset_type}</span>
            <span>{analytics.instrument.symbol}</span>
            <span className="status-badge">{statusText(analytics)}</span>
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)] lg:text-5xl">{analytics.instrument.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">{analytics.instrument.notes || "这个标的还没有写投资逻辑，建议补上你的建仓前提、风控边界和关注因素。"}</p>
          </div>
        </div>
        <div className="space-y-2 text-right">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Latest Snapshot</p>
          <p className="font-mono text-4xl font-semibold text-[var(--ink-strong)]">{formatNumber(analytics.currentPrice, 4)}</p>
          <p className="text-sm text-[var(--muted)]">{analytics.lastSnapshot ? formatDate(analytics.lastSnapshot.snapshot_date) : "尚未录入价格快照"}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="持仓市值" value={formatMoney(analytics.marketValue, analytics.instrument.currency)} hint={`持仓数量 ${formatNumber(analytics.quantityHeld, 2)}`} />
        <SummaryMetric label="持仓成本" value={formatMoney(analytics.costBasis, analytics.instrument.currency)} hint={`保本线 ${formatNumber(analytics.breakEvenPrice, 4)}`} />
        <SummaryMetric label="浮动盈亏" value={formatMoney(analytics.unrealizedPnl, analytics.instrument.currency)} hint={`收益率 ${formatPercent(profitRate)}`} tone={toneClass(analytics.unrealizedPnl)} />
        <SummaryMetric label="已实现收益" value={formatMoney(analytics.realizedPnl, analytics.instrument.currency)} hint={`分红收入 ${formatMoney(analytics.dividendIncome, analytics.instrument.currency)}`} tone={toneClass(analytics.realizedPnl)} />
      </div>
    </section>
  );
}

function DecisionPanel({ analytics }: { analytics: InstrumentAnalytics }) {
  return (
    <section className="panel space-y-5">
      <div className="section-header">
        <div>
          <p className="section-kicker">策略建议</p>
          <h3>{analytics.suggestion.headline}</h3>
        </div>
        <div className="text-sm text-[var(--muted)]">仓位占用 {formatPercent(analytics.suggestion.positionUsage)}</div>
      </div>

      <p className="text-sm leading-7 text-[var(--muted)]">{analytics.suggestion.detail}</p>
      <p className="rounded-[22px] bg-[rgba(30,63,102,0.06)] px-4 py-3 text-sm leading-7 text-[var(--ink)]">{analytics.suggestion.action}</p>

      <div className="space-y-3 border-t border-[var(--line)] pt-4">
        <div className="decision-row">
          <span>当前价</span>
          <strong>{formatNumber(analytics.currentPrice, 4)}</strong>
        </div>
        <div className="decision-row">
          <span>计划买入带</span>
          <strong>{formatNumber(analytics.suggestion.buyZone.low, 4)} - {formatNumber(analytics.suggestion.buyZone.high, 4)}</strong>
        </div>
        <div className="decision-row">
          <span>计划卖出带</span>
          <strong>{formatNumber(analytics.suggestion.sellZone.low, 4)} - {formatNumber(analytics.suggestion.sellZone.high, 4)}</strong>
        </div>
        <div className="decision-row">
          <span>策略步长</span>
          <strong>买入 {formatPercent(analytics.instrument.buy_step_ratio)} / 卖出 {formatPercent(analytics.instrument.sell_step_ratio)}</strong>
        </div>
        <div className="decision-row">
          <span>最近交易</span>
          <strong>{analytics.lastTrade ? `${tradeTypeLabel(analytics.lastTrade)} · ${formatDate(analytics.lastTrade.trade_date)}` : "暂无"}</strong>
        </div>
      </div>
    </section>
  );
}

function TradeLedger({ analytics }: { analytics: InstrumentAnalytics }) {
  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">交易账本</p>
          <h3>按时间复盘每一次动作</h3>
        </div>
        <div className="text-sm text-[var(--muted)]">手续费与税费合计 {formatMoney(analytics.feesAndTaxes, analytics.instrument.currency)}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>类型</th>
              <th>数量</th>
              <th>价格</th>
              <th>现金</th>
              <th>原因</th>
              <th>信心</th>
            </tr>
          </thead>
          <tbody>
            {analytics.trades.length > 0 ? (
              analytics.trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{formatDate(trade.trade_date)}</td>
                  <td>{tradeTypeLabel(trade)}</td>
                  <td>{formatNumber(trade.quantity, 2)}</td>
                  <td>{formatNumber(trade.price, 4)}</td>
                  <td>{formatMoney(trade.cash_amount || trade.quantity * trade.price, analytics.instrument.currency)}</td>
                  <td>{trade.reason || "--"}</td>
                  <td>{trade.confidence ? `${trade.confidence} 分` : "--"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-[var(--muted)]">暂无交易记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReviewTimeline({ analytics }: { analytics: InstrumentAnalytics }) {
  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">复盘时间线</p>
          <h3>留下判断，而不是只留下结果</h3>
        </div>
      </div>

      <div className="space-y-4">
        {analytics.reviews.length > 0 ? (
          analytics.reviews.map((review) => (
            <article key={review.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                  <span>{formatDate(review.review_date)}</span>
                  {review.mood ? <span>{review.mood}</span> : null}
                </div>
                <h4 className="text-lg font-medium text-[var(--ink-strong)]">{review.title}</h4>
                <p className="text-sm leading-7 text-[var(--muted)]">{review.content}</p>
                {review.action_plan ? <p className="rounded-[18px] bg-[rgba(198,110,53,0.08)] px-4 py-3 text-sm text-[var(--ink)]">下一步：{review.action_plan}</p> : null}
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">还没有复盘笔记。建议在每次关键买卖后留下“为什么做、哪里做对了、哪里做错了”。</p>
        )}
      </div>
    </section>
  );
}

function Sidebar({ overview }: { overview: PortfolioOverview }) {
  return (
    <aside className="panel panel-sidebar space-y-6 xl:sticky xl:top-4 xl:self-start">
      <div className="space-y-3">
        <p className="section-kicker">StockHunter</p>
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">把每一笔交易，变成可复盘的决策样本。</h2>
        <p className="text-sm leading-7 text-[var(--muted)]">你可以记录交易、维护价格快照、计算动态成本，并把自己的买卖纪律沉淀成一套长期可执行的框架。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <SummaryMetric label="组合总市值" value={formatMoney(overview.totals.marketValue)} hint={`成本 ${formatMoney(overview.totals.costBasis)}`} />
        <SummaryMetric label="组合总盈亏" value={formatMoney(overview.totals.unrealizedPnl)} hint={`已实现 ${formatMoney(overview.totals.realizedPnl)}`} tone={toneClass(overview.totals.unrealizedPnl)} />
      </div>

      <div className="space-y-3 border-t border-[var(--line)] pt-5">
        <div className="section-header">
          <div>
            <p className="section-kicker">标的列表</p>
            <h3>切换查看不同标的</h3>
          </div>
        </div>
        <div className="space-y-2">
          {overview.analyticsList.length > 0 ? (
            overview.analyticsList.map((item) => {
              const active = overview.selected?.instrument.id === item.instrument.id;
              return (
                <Link key={item.instrument.id} href={`/?instrument=${item.instrument.id}`} className={`instrument-link ${active ? "instrument-link-active" : ""}`}>
                  <div>
                    <p className="text-base font-medium text-[var(--ink-strong)]">{item.instrument.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{item.instrument.market} · {item.instrument.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-[var(--ink-strong)]">{formatNumber(item.currentPrice, 4)}</p>
                    <p className={`text-xs ${toneClass(item.unrealizedPnl)}`}>{formatMoney(item.unrealizedPnl, item.instrument.currency)}</p>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-[var(--muted)]">还没有标的，右侧先新增一个，或者写入演示数据体验完整流程。</p>
          )}
        </div>
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <section className="panel panel-hero flex min-h-[520px] items-center justify-center">
      <div className="max-w-2xl space-y-5 text-center">
        <p className="section-kicker">从第一笔记录开始</p>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">先创建一个标的，然后逐步把交易历史、价格快照和复盘笔记补齐。</h1>
        <p className="text-sm leading-7 text-[var(--muted)]">StockHunter 的核心不是“记流水”而已，而是把买入原因、仓位控制、兑现节奏和复盘结论都放在同一张工作台上。</p>
      </div>
    </section>
  );
}

export function DashboardShell({ overview }: { overview: PortfolioOverview }) {
  return (
    <div className="mx-auto min-h-screen max-w-[1680px] px-4 py-4 lg:px-6">
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Sidebar overview={overview} />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {overview.selected ? (
              <>
                <SelectedInstrumentPanel analytics={overview.selected} />
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <PriceBandChart analytics={overview.selected} />
                  <DecisionPanel analytics={overview.selected} />
                </div>
                <PositionHistoryChart analytics={overview.selected} />
                <TradeLedger analytics={overview.selected} />
                <ReviewTimeline analytics={overview.selected} />
              </>
            ) : (
              <EmptyState />
            )}
          </div>

          <FormsPanel instruments={overview.analyticsList.map((item) => item.instrument)} selectedInstrumentId={overview.selected?.instrument.id ?? null} />
        </div>
      </div>
    </div>
  );
}
