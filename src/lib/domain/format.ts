const moneyFormatterCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: number | null, currency = "CNY") {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  const cacheKey = `money-${currency}`;
  if (!moneyFormatterCache.has(cacheKey)) {
    moneyFormatterCache.set(
      cacheKey,
      new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  }

  return moneyFormatterCache.get(cacheKey)!.format(value);
}

export function formatNumber(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${formatNumber(value * 100, digits)}%`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
