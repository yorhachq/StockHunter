import { formatMoney, formatNumber } from "@/lib/domain/format";
import type { InstrumentAnalytics } from "@/lib/domain/types";

const width = 760;
const height = 220;
const padding = 24;

export function PositionHistoryChart({ analytics }: { analytics: InstrumentAnalytics }) {
  const points = analytics.chartPoints;

  if (points.length === 0) {
    return (
      <div className="panel panel-muted flex min-h-[220px] items-center justify-center text-sm text-[var(--muted)]">
        暂无时间线数据。
      </div>
    );
  }

  const maxQuantity = Math.max(...points.map((point) => point.quantity), 1);
  const maxAbsPnl = Math.max(...points.map((point) => Math.abs(point.realizedPnl)), 1);
  const barWidth = (width - padding * 2) / points.length;
  const linePoints = points
    .map((point, index) => {
      const x = padding + barWidth * index + barWidth / 2;
      const y = height - padding - ((point.realizedPnl + maxAbsPnl) / (maxAbsPnl * 2 || 1)) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">仓位轨迹</p>
          <h3>持仓数量与累计已实现收益</h3>
        </div>
        <div className="text-right text-sm text-[var(--muted)]">
          <p>当前持仓 {formatNumber(analytics.quantityHeld, 2)}</p>
          <p>累计已实现 {formatMoney(analytics.realizedPnl, analytics.instrument.currency)}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full rounded-[24px] bg-[var(--panel-soft)]">
        <rect x={0} y={0} width={width} height={height} rx={24} fill="rgba(255,255,255,0.35)" />
        {[0, 0.5, 1].map((ratio) => {
          const y = height - padding - ratio * (height - padding * 2);
          return <line key={ratio} x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(40,50,70,0.08)" strokeDasharray="4 8" />;
        })}

        {points.map((point, index) => {
          const barHeight = (point.quantity / maxQuantity) * (height - padding * 2);
          const x = padding + barWidth * index + 5;
          const y = height - padding - barHeight;
          return <rect key={`${point.date}-${point.quantity}`} x={x} y={y} width={Math.max(barWidth - 10, 10)} height={barHeight} rx={8} fill="rgba(30, 63, 102, 0.2)" />;
        })}

        <polyline fill="none" stroke="rgba(39, 126, 98, 0.95)" strokeWidth={3} points={linePoints} />
      </svg>

      <div className="flex flex-wrap gap-5 text-xs text-[var(--muted)]">
        <span className="legend-item"><i style={{ background: "rgba(30, 63, 102, 0.2)" }} />持仓数量</span>
        <span className="legend-item"><i style={{ background: "rgba(39, 126, 98, 0.95)" }} />累计已实现收益</span>
      </div>
    </section>
  );
}
