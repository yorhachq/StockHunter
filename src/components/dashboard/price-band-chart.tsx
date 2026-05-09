"use client";

import { useMemo, useRef, useState } from "react";
import { formatDate, formatMoney, formatNumber } from "@/lib/domain/format";
import type { ChartPoint, InstrumentAnalytics, TradeRow } from "@/lib/domain/types";

const chartWidth = 760;
const chartHeight = 280;
const padding = 24;

type TooltipState = {
  point: ChartPoint;
  left: number;
  top: number;
};

function buildPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
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

function tradeMarkerColor(trade: TradeRow) {
  if (trade.trade_type === "BUY") {
    return "rgba(39, 126, 98, 1)";
  }
  if (trade.trade_type === "SELL") {
    return "rgba(193, 84, 62, 1)";
  }
  if (trade.trade_type === "DIVIDEND") {
    return "rgba(198, 110, 53, 1)";
  }
  return "rgba(30, 63, 102, 1)";
}

function tradeMarkerShape(trade: TradeRow, x: number, y: number) {
  const color = tradeMarkerColor(trade);

  if (trade.trade_type === "BUY") {
    return <circle cx={x} cy={y} r={5.5} fill={color} />;
  }

  if (trade.trade_type === "SELL") {
    return <path d={`M ${x} ${y - 6} L ${x + 6} ${y + 6} L ${x - 6} ${y + 6} Z`} fill={color} />;
  }

  if (trade.trade_type === "DIVIDEND") {
    return <rect x={x - 5} y={y - 5} width={10} height={10} rx={2.5} fill={color} />;
  }

  return <path d={`M ${x} ${y - 6} L ${x + 6} ${y} L ${x} ${y + 6} L ${x - 6} ${y} Z`} fill={color} />;
}

function TooltipCard({ analytics, tooltip }: { analytics: InstrumentAnalytics; tooltip: TooltipState }) {
  const delta = tooltip.point.price !== null && tooltip.point.avgCost !== null ? tooltip.point.price - tooltip.point.avgCost : null;

  return (
    <div
      className="pointer-events-none absolute z-20 w-[300px] rounded-[20px] border border-[rgba(36,50,70,0.12)] bg-[rgba(255,250,244,0.96)] p-4 shadow-[0_24px_48px_rgba(24,34,51,0.14)]"
      style={{ left: tooltip.left, top: tooltip.top }}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">{formatDate(tooltip.point.date)}</p>
        <p className="text-sm text-[var(--muted)]">价格 {formatNumber(tooltip.point.price, 4)} · 成本 {formatNumber(tooltip.point.avgCost, 4)}</p>
        <p className={`text-sm font-medium ${delta === null ? "text-[var(--ink)]" : delta >= 0 ? "text-[var(--rise)]" : "text-[var(--fall)]"}`}>
          当日成本差 {delta === null ? "--" : formatNumber(delta, 4)}
        </p>
      </div>

      {tooltip.point.trades.length > 0 ? (
        <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-3">
          {tooltip.point.trades.map((trade) => (
            <article key={trade.id} className="space-y-1 rounded-[16px] bg-[rgba(255,255,255,0.5)] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-[var(--ink-strong)]">{tradeTypeLabel(trade)}</strong>
                <span className="text-xs text-[var(--muted)]">信心 {trade.confidence ? `${trade.confidence} 分` : "--"}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">成交价格 {formatNumber(trade.price, 4)} · 数量/份额 {formatNumber(trade.quantity, 2)}</p>
              <p className="text-xs text-[var(--muted)]">成交金额 {formatMoney(trade.cash_amount || trade.quantity * trade.price, analytics.instrument.currency)}</p>
              <p className="text-xs text-[var(--muted)]">手续费/税费 {formatMoney(trade.fee + trade.tax, analytics.instrument.currency)}</p>
              <p className="text-xs text-[var(--muted)]">触发原因 {trade.reason || "--"}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">当日没有交易，仅记录价格或成本轨迹。</p>
      )}
    </div>
  );
}

export function PriceBandChart({ analytics }: { analytics: InstrumentAnalytics }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const points = analytics.chartPoints.filter((point) => point.price !== null || point.avgCost !== null || point.trades.length > 0);

  const chartData = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const values = points.flatMap((point) => [point.price, point.avgCost]).filter((value): value is number => value !== null);
    values.push(analytics.suggestion.buyZone.low, analytics.suggestion.buyZone.high, analytics.suggestion.sellZone.low, analytics.suggestion.sellZone.high);

    const minValue = Math.min(...values) * 0.96;
    const maxValue = Math.max(...values) * 1.04;
    const xStep = points.length > 1 ? (chartWidth - padding * 2) / (points.length - 1) : 0;
    const yOf = (value: number) => chartHeight - padding - ((value - minValue) / (maxValue - minValue || 1)) * (chartHeight - padding * 2);

    const coordinates = points.map((point, index) => {
      const x = padding + xStep * index;
      const priceY = point.price !== null ? yOf(point.price) : null;
      const costY = point.avgCost !== null ? yOf(point.avgCost) : null;
      const anchorY = priceY ?? costY ?? chartHeight / 2;

      return {
        point,
        x,
        priceY,
        costY,
        anchorY,
      };
    });

    return {
      minValue,
      maxValue,
      yOf,
      coordinates,
      pricePolyline: buildPolyline(coordinates.filter((item) => item.priceY !== null).map((item) => ({ x: item.x, y: item.priceY as number }))),
      costPolyline: buildPolyline(coordinates.filter((item) => item.costY !== null).map((item) => ({ x: item.x, y: item.costY as number }))),
    };
  }, [analytics.suggestion.buyZone.high, analytics.suggestion.buyZone.low, analytics.suggestion.sellZone.high, analytics.suggestion.sellZone.low, points]);

  if (!chartData) {
    return (
      <div className="panel panel-muted flex min-h-[280px] items-center justify-center text-sm text-[var(--muted)]">
        暂无价格或成本轨迹，先录入交易与价格快照。
      </div>
    );
  }

  function showTooltip(point: ChartPoint, clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const left = Math.min(Math.max(clientX - rect.left + 14, 12), rect.width - 312);
    const top = Math.min(Math.max(clientY - rect.top - 12, 12), rect.height - 220);
    setTooltip({ point, left, top });
  }

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">价格带推演</p>
          <h3>价格、成本与建议区间同屏比对</h3>
        </div>
        <div className="text-right text-sm text-[var(--muted)]">
          <p>买入带 {formatNumber(analytics.suggestion.buyZone.low, 4)} - {formatNumber(analytics.suggestion.buyZone.high, 4)}</p>
          <p>卖出带 {formatNumber(analytics.suggestion.sellZone.low, 4)} - {formatNumber(analytics.suggestion.sellZone.high, 4)}</p>
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[280px] w-full overflow-visible rounded-[24px] bg-[var(--panel-soft)]">
          <rect x={0} y={0} width={chartWidth} height={chartHeight} rx={24} fill="rgba(255,255,255,0.35)" />
          <rect x={0} y={chartData.yOf(analytics.suggestion.sellZone.high)} width={chartWidth} height={chartData.yOf(analytics.suggestion.sellZone.low) - chartData.yOf(analytics.suggestion.sellZone.high)} fill="rgba(193, 84, 62, 0.12)" />
          <rect x={0} y={chartData.yOf(analytics.suggestion.buyZone.high)} width={chartWidth} height={chartData.yOf(analytics.suggestion.buyZone.low) - chartData.yOf(analytics.suggestion.buyZone.high)} fill="rgba(39, 126, 98, 0.12)" />

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * (chartHeight - padding * 2);
            const value = chartData.maxValue - (chartData.maxValue - chartData.minValue) * ratio;
            return (
              <g key={ratio}>
                <line x1={padding} x2={chartWidth - padding} y1={y} y2={y} stroke="rgba(40,50,70,0.08)" strokeDasharray="4 8" />
                <text x={chartWidth - padding + 4} y={y + 4} fontSize="11" fill="rgba(60,72,92,0.72)">{formatNumber(value, 4)}</text>
              </g>
            );
          })}

          <polyline fill="none" stroke="rgba(198, 110, 53, 0.95)" strokeWidth={3} points={chartData.pricePolyline} />
          <polyline fill="none" stroke="rgba(30, 63, 102, 0.95)" strokeWidth={3} strokeDasharray="10 8" points={chartData.costPolyline} />

          {chartData.coordinates.map(({ point, x, priceY, costY, anchorY }) => (
            <g
              key={point.date}
              onMouseEnter={(event) => showTooltip(point, event.clientX, event.clientY)}
              onMouseMove={(event) => showTooltip(point, event.clientX, event.clientY)}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect x={x - 10} y={padding - 4} width={20} height={chartHeight - padding * 2 + 8} fill="transparent" />
              {priceY !== null ? <circle cx={x} cy={priceY} r={4.5} fill="rgba(198, 110, 53, 1)" /> : null}
              {costY !== null ? <circle cx={x} cy={costY} r={4} fill="rgba(30, 63, 102, 1)" /> : null}
              {point.trades.map((trade, index) => tradeMarkerShape(trade, x, anchorY - 16 - index * 16))}
            </g>
          ))}
        </svg>

        {tooltip ? <TooltipCard analytics={analytics} tooltip={tooltip} /> : null}
      </div>

      <div className="flex flex-wrap gap-5 text-xs text-[var(--muted)]">
        <span className="legend-item"><i style={{ background: "rgba(198, 110, 53, 0.95)" }} />价格轨迹</span>
        <span className="legend-item"><i style={{ background: "rgba(30, 63, 102, 0.95)" }} />动态成本线</span>
        <span className="legend-item"><i style={{ background: "rgba(39, 126, 98, 0.5)" }} />计划买入带</span>
        <span className="legend-item"><i style={{ background: "rgba(193, 84, 62, 0.5)" }} />计划卖出带</span>
        <span className="legend-item"><i style={{ background: "rgba(39, 126, 98, 1)", width: 10, height: 10, borderRadius: "999px" }} />买入点</span>
        <span className="legend-item"><i style={{ background: "rgba(193, 84, 62, 1)", width: 10, height: 10, clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />卖出点</span>
        <span className="legend-item"><i style={{ background: "rgba(198, 110, 53, 1)", width: 10, height: 10, borderRadius: 2 }} />分红</span>
        <span className="legend-item"><i style={{ background: "rgba(30, 63, 102, 1)", width: 10, height: 10, transform: "rotate(45deg)" }} />送股</span>
      </div>
    </section>
  );
}
