import { formatNumber } from "@/lib/domain/format";
import type { InstrumentAnalytics } from "@/lib/domain/types";

const chartWidth = 760;
const chartHeight = 280;
const padding = 24;

function buildPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function PriceBandChart({ analytics }: { analytics: InstrumentAnalytics }) {
  const validPricePoints = analytics.chartPoints.filter(
    (point) => point.price !== null || point.avgCost !== null,
  );

  if (validPricePoints.length === 0) {
    return (
      <div className="panel panel-muted flex min-h-[280px] items-center justify-center text-sm text-[var(--muted)]">
        暂无价格或成本轨迹，先录入交易与价格快照。
      </div>
    );
  }

  const values = validPricePoints.flatMap((point) => [point.price, point.avgCost]).filter((value): value is number => value !== null);
  values.push(analytics.suggestion.buyZone.low, analytics.suggestion.buyZone.high, analytics.suggestion.sellZone.low, analytics.suggestion.sellZone.high);

  const minValue = Math.min(...values) * 0.96;
  const maxValue = Math.max(...values) * 1.04;
  const xStep = validPricePoints.length > 1 ? (chartWidth - padding * 2) / (validPricePoints.length - 1) : 0;
  const yOf = (value: number) => chartHeight - padding - ((value - minValue) / (maxValue - minValue || 1)) * (chartHeight - padding * 2);

  const pricePolyline = buildPolyline(
    validPricePoints
      .filter((point) => point.price !== null)
      .map((point, index) => ({ x: padding + xStep * index, y: yOf(point.price as number) })),
  );

  const costPolyline = buildPolyline(
    validPricePoints
      .filter((point) => point.avgCost !== null)
      .map((point, index) => ({ x: padding + xStep * index, y: yOf(point.avgCost as number) })),
  );

  const currentX = padding + xStep * (validPricePoints.length - 1);
  const currentY = analytics.currentPrice !== null ? yOf(analytics.currentPrice) : null;

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

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[280px] w-full overflow-visible rounded-[24px] bg-[var(--panel-soft)]">
        <rect x={0} y={0} width={chartWidth} height={chartHeight} rx={24} fill="rgba(255,255,255,0.35)" />
        <rect x={0} y={yOf(analytics.suggestion.sellZone.high)} width={chartWidth} height={yOf(analytics.suggestion.sellZone.low) - yOf(analytics.suggestion.sellZone.high)} fill="rgba(193, 84, 62, 0.12)" />
        <rect x={0} y={yOf(analytics.suggestion.buyZone.high)} width={chartWidth} height={yOf(analytics.suggestion.buyZone.low) - yOf(analytics.suggestion.buyZone.high)} fill="rgba(39, 126, 98, 0.12)" />

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          const value = maxValue - (maxValue - minValue) * ratio;
          return (
            <g key={ratio}>
              <line x1={padding} x2={chartWidth - padding} y1={y} y2={y} stroke="rgba(40,50,70,0.08)" strokeDasharray="4 8" />
              <text x={chartWidth - padding + 4} y={y + 4} fontSize="11" fill="rgba(60,72,92,0.72)">{formatNumber(value, 4)}</text>
            </g>
          );
        })}

        <polyline fill="none" stroke="rgba(198, 110, 53, 0.95)" strokeWidth={3} points={pricePolyline} />
        <polyline fill="none" stroke="rgba(30, 63, 102, 0.95)" strokeWidth={3} strokeDasharray="10 8" points={costPolyline} />

        {currentY !== null ? <circle cx={currentX} cy={currentY} r={5.5} fill="rgba(198, 110, 53, 1)" /> : null}
      </svg>

      <div className="flex flex-wrap gap-5 text-xs text-[var(--muted)]">
        <span className="legend-item"><i style={{ background: "rgba(198, 110, 53, 0.95)" }} />价格轨迹</span>
        <span className="legend-item"><i style={{ background: "rgba(30, 63, 102, 0.95)" }} />动态成本线</span>
        <span className="legend-item"><i style={{ background: "rgba(39, 126, 98, 0.5)" }} />计划买入带</span>
        <span className="legend-item"><i style={{ background: "rgba(193, 84, 62, 0.5)" }} />计划卖出带</span>
      </div>
    </section>
  );
}
