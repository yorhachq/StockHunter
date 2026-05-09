"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createInstrumentAction,
  createReviewAction,
  createSnapshotAction,
  createTradeAction,
  seedDemoAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatMoney, formatNumber } from "@/lib/domain/format";
import { assetTypes, tradeTypes, type InstrumentAnalytics, type InstrumentRow, type TradeType } from "@/lib/domain/types";
import { initialActionFormState, type ActionFormState } from "@/lib/forms/state";

type FormsPanelProps = {
  instruments: InstrumentRow[];
  selectedInstrumentId: string | null;
  selectedAnalytics: InstrumentAnalytics | null;
};

const today = new Date().toISOString().slice(0, 10);

function firstFieldError(state: ActionFormState, field: string) {
  return state.fieldErrors[field]?.[0] ?? "";
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="field-error">{message}</p>;
}

function FormMessage({ state }: { state: ActionFormState }) {
  if (!state.message && state.formErrors.length === 0) {
    return null;
  }

  return (
    <div className="form-message" role="alert">
      <p>{state.message}</p>
      {state.formErrors.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function InstrumentSelect({
  instruments,
  selectedInstrumentId,
  name = "instrumentId",
}: {
  instruments: InstrumentRow[];
  selectedInstrumentId: string | null;
  name?: string;
}) {
  const fallbackId = selectedInstrumentId ?? instruments[0]?.id ?? "";

  return (
    <select className="field" defaultValue={fallbackId} name={name} required>
      {instruments.map((instrument) => (
        <option key={instrument.id} value={instrument.id}>
          {instrument.name} ({instrument.symbol})
        </option>
      ))}
    </select>
  );
}

function InstrumentForm() {
  const [state, formAction] = useActionState(createInstrumentAction, initialActionFormState);
  const [values, setValues] = useState({
    targetPositionAmount: "30000",
    maxPositionAmount: "50000",
    buyStepRatio: "0.04",
    sellStepRatio: "0.06",
    reboundRatio: "0.03",
  });

  const clientErrors = useMemo(() => {
    const target = Number(values.targetPositionAmount || 0);
    const max = Number(values.maxPositionAmount || 0);
    const buy = Number(values.buyStepRatio || 0);
    const sell = Number(values.sellStepRatio || 0);
    const rebound = Number(values.reboundRatio || 0);

    return {
      targetPositionAmount: target > max ? "目标持仓金额不能大于最大持仓金额" : "",
      buyStepRatio: buy <= 0 || buy >= 1 ? "买入步长必须大于 0 且小于 1" : "",
      sellStepRatio: sell <= 0 || sell >= 1 ? "卖出步长必须大于 0 且小于 1" : "",
      reboundRatio: rebound <= 0 || rebound >= 1 ? "反弹确认比例必须大于 0 且小于 1" : "",
    };
  }, [values]);

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">基础配置</p>
          <h3>新增交易标的</h3>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        <FormMessage state={state} />
        <div className="field-grid field-grid-2">
          <div>
            <input className="field" name="symbol" placeholder="代码，例如 513100" required />
            <FieldError message={firstFieldError(state, "symbol")} />
          </div>
          <div>
            <input className="field" name="name" placeholder="名称，例如 纳指 ETF" required />
            <FieldError message={firstFieldError(state, "name")} />
          </div>
        </div>
        <div className="field-grid field-grid-3">
          <div>
            <input className="field" defaultValue="CN" name="market" placeholder="市场" required />
            <FieldError message={firstFieldError(state, "market")} />
          </div>
          <div>
            <select className="field" defaultValue="ETF" name="assetType" required>
              {assetTypes.map((assetType) => (
                <option key={assetType} value={assetType}>
                  {assetType}
                </option>
              ))}
            </select>
            <FieldError message={firstFieldError(state, "assetType")} />
          </div>
          <div>
            <input className="field" defaultValue="CNY" name="currency" placeholder="币种" required />
            <FieldError message={firstFieldError(state, "currency")} />
          </div>
        </div>
        <div className="field-grid field-grid-2">
          <div>
            <input
              className="field"
              defaultValue={values.targetPositionAmount}
              min="0"
              name="targetPositionAmount"
              placeholder="目标持仓金额"
              step="0.01"
              type="number"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, targetPositionAmount: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.targetPositionAmount || firstFieldError(state, "targetPositionAmount")} />
          </div>
          <div>
            <input
              className="field"
              defaultValue={values.maxPositionAmount}
              min="0"
              name="maxPositionAmount"
              placeholder="最大持仓金额"
              step="0.01"
              type="number"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, maxPositionAmount: event.currentTarget.value }))}
            />
            <FieldError message={firstFieldError(state, "maxPositionAmount")} />
          </div>
        </div>
        <div className="field-grid field-grid-3">
          <div>
            <input
              className="field"
              defaultValue={values.buyStepRatio}
              max="0.999"
              min="0.001"
              name="buyStepRatio"
              placeholder="买入步长"
              step="0.001"
              type="number"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, buyStepRatio: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.buyStepRatio || firstFieldError(state, "buyStepRatio")} />
          </div>
          <div>
            <input
              className="field"
              defaultValue={values.sellStepRatio}
              max="0.999"
              min="0.001"
              name="sellStepRatio"
              placeholder="卖出步长"
              step="0.001"
              type="number"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, sellStepRatio: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.sellStepRatio || firstFieldError(state, "sellStepRatio")} />
          </div>
          <div>
            <input
              className="field"
              defaultValue={values.reboundRatio}
              max="0.999"
              min="0.001"
              name="reboundRatio"
              placeholder="反弹确认"
              step="0.001"
              type="number"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, reboundRatio: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.reboundRatio || firstFieldError(state, "reboundRatio")} />
          </div>
        </div>
        <div>
          <textarea className="field min-h-[84px]" name="notes" placeholder="补充长期投资逻辑、风控原则或观察点" />
          <FieldError message={firstFieldError(state, "notes")} />
        </div>
        <SubmitButton className="primary-btn w-full" label="保存标的" pendingLabel="正在保存..." />
      </form>
    </section>
  );
}

function TradeForm({ instruments, selectedInstrumentId }: { instruments: InstrumentRow[]; selectedInstrumentId: string | null }) {
  const [state, formAction] = useActionState(createTradeAction, initialActionFormState);
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [values, setValues] = useState({ quantity: "0", price: "0", cashAmount: "0" });
  const selectedInstrument = instruments.find((instrument) => instrument.id === (selectedInstrumentId ?? instruments[0]?.id)) ?? instruments[0] ?? null;
  const availableQuantityHint = selectedInstrument ? `${selectedInstrument.name} 的可卖数量会在服务端再次校验。` : "";

  const clientErrors = useMemo(() => {
    const quantity = Number(values.quantity || 0);
    const price = Number(values.price || 0);
    const cashAmount = Number(values.cashAmount || 0);

    return {
      quantity:
        tradeType === "BUY" || tradeType === "SELL"
          ? quantity <= 0
            ? `${tradeType === "BUY" ? "买入" : "卖出"}数量必须大于 0`
            : ""
          : tradeType === "BONUS" && quantity <= 0
            ? "送股数量必须大于 0"
            : "",
      price:
        tradeType === "BUY" || tradeType === "SELL"
          ? price <= 0
            ? `${tradeType === "BUY" ? "买入" : "卖出"}价格必须大于 0`
            : ""
          : "",
      cashAmount: tradeType === "DIVIDEND" && cashAmount <= 0 ? "分红到账金额必须大于 0" : "",
    };
  }, [tradeType, values]);

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">交易录入</p>
          <h3>新增交易流水</h3>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        <FormMessage state={state} />
        <InstrumentSelect instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
        <div className="field-grid field-grid-2">
          <div>
            <input className="field" defaultValue={today} name="tradeDate" type="date" required />
            <FieldError message={firstFieldError(state, "tradeDate")} />
          </div>
          <div>
            <select
              className="field"
              defaultValue="BUY"
              name="tradeType"
              required
              onChange={(event) => setTradeType(event.currentTarget.value as TradeType)}
            >
              {tradeTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <FieldError message={firstFieldError(state, "tradeType")} />
          </div>
        </div>
        <div className="field-grid field-grid-2">
          <div>
            <input
              className="field"
              defaultValue="0"
              min="0"
              name="quantity"
              step="0.0001"
              type="number"
              placeholder="数量"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, quantity: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.quantity || firstFieldError(state, "quantity")} />
          </div>
          <div>
            <input
              className="field"
              defaultValue="0"
              min="0"
              name="price"
              step="0.0001"
              type="number"
              placeholder="价格"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, price: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.price || firstFieldError(state, "price")} />
          </div>
        </div>
        <div className="field-grid field-grid-3">
          <div>
            <input className="field" defaultValue="0" min="0" name="fee" step="0.01" type="number" placeholder="手续费" required />
            <FieldError message={firstFieldError(state, "fee")} />
          </div>
          <div>
            <input className="field" defaultValue="0" min="0" name="tax" step="0.01" type="number" placeholder="税费" required />
            <FieldError message={firstFieldError(state, "tax")} />
          </div>
          <div>
            <input
              className="field"
              defaultValue="0"
              min="0"
              name="cashAmount"
              step="0.01"
              type="number"
              placeholder="现金金额"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, cashAmount: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.cashAmount || firstFieldError(state, "cashAmount")} />
          </div>
        </div>
        {tradeType === "SELL" ? <p className="field-hint">{availableQuantityHint}</p> : null}
        <div>
          <input className="field" name="reason" placeholder="触发原因，例如 回撤补仓 / 达到目标收益" />
          <FieldError message={firstFieldError(state, "reason")} />
        </div>
        <div>
          <textarea className="field min-h-[88px]" name="thesis" placeholder="详细描述本次交易的判断、计划与预期" />
          <FieldError message={firstFieldError(state, "thesis")} />
        </div>
        <div>
          <select className="field" defaultValue="3" name="confidence">
            <option value="">不记录信心分</option>
            <option value="1">1 分</option>
            <option value="2">2 分</option>
            <option value="3">3 分</option>
            <option value="4">4 分</option>
            <option value="5">5 分</option>
          </select>
          <FieldError message={firstFieldError(state, "confidence")} />
        </div>
        <SubmitButton className="primary-btn w-full" label="写入交易" pendingLabel="正在写入..." />
      </form>
    </section>
  );
}

function SnapshotForm({ instruments, selectedInstrumentId }: { instruments: InstrumentRow[]; selectedInstrumentId: string | null }) {
  const [state, formAction] = useActionState(createSnapshotAction, initialActionFormState);
  const [values, setValues] = useState({ closePrice: "0", highPrice: "", lowPrice: "" });

  const clientErrors = useMemo(() => {
    const closePrice = Number(values.closePrice || 0);
    const highPrice = values.highPrice ? Number(values.highPrice) : null;
    const lowPrice = values.lowPrice ? Number(values.lowPrice) : null;

    return {
      closePrice:
        closePrice <= 0
          ? "收盘价必须大于 0"
          : highPrice !== null && closePrice > highPrice
            ? "收盘价不能高于最高价"
            : lowPrice !== null && closePrice < lowPrice
              ? "收盘价不能低于最低价"
              : "",
      highPrice: highPrice !== null && lowPrice !== null && highPrice < lowPrice ? "最高价不能低于最低价" : "",
      lowPrice: "",
    };
  }, [values]);

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">行情补录</p>
          <h3>新增价格快照</h3>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        <FormMessage state={state} />
        <InstrumentSelect instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
        <div className="field-grid field-grid-2">
          <div>
            <input className="field" defaultValue={today} name="snapshotDate" type="date" required />
            <FieldError message={firstFieldError(state, "snapshotDate")} />
          </div>
          <div>
            <input
              className="field"
              defaultValue="0"
              min="0.0001"
              name="closePrice"
              step="0.0001"
              type="number"
              placeholder="收盘价/参考价"
              required
              onInput={(event) => setValues((prev) => ({ ...prev, closePrice: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.closePrice || firstFieldError(state, "closePrice")} />
          </div>
        </div>
        <div className="field-grid field-grid-3">
          <div>
            <input
              className="field"
              min="0"
              name="highPrice"
              step="0.0001"
              type="number"
              placeholder="最高价"
              onInput={(event) => setValues((prev) => ({ ...prev, highPrice: event.currentTarget.value }))}
            />
            <FieldError message={clientErrors.highPrice || firstFieldError(state, "highPrice")} />
          </div>
          <div>
            <input
              className="field"
              min="0"
              name="lowPrice"
              step="0.0001"
              type="number"
              placeholder="最低价"
              onInput={(event) => setValues((prev) => ({ ...prev, lowPrice: event.currentTarget.value }))}
            />
            <FieldError message={firstFieldError(state, "lowPrice")} />
          </div>
          <div>
            <input className="field" min="0" name="volume" step="0.01" type="number" placeholder="成交量" />
            <FieldError message={firstFieldError(state, "volume")} />
          </div>
        </div>
        <div>
          <textarea className="field min-h-[72px]" name="note" placeholder="记录价格异动、消息面或技术形态备注" />
          <FieldError message={firstFieldError(state, "note")} />
        </div>
        <SubmitButton className="secondary-btn w-full" label="保存价格快照" pendingLabel="正在保存..." />
      </form>
    </section>
  );
}

function ReviewForm({ instruments, selectedInstrumentId }: { instruments: InstrumentRow[]; selectedInstrumentId: string | null }) {
  const [state, formAction] = useActionState(createReviewAction, initialActionFormState);
  const [values, setValues] = useState({ title: "", content: "" });

  const clientErrors = useMemo(() => ({
    title: values.title.trim() ? "" : "请输入复盘标题",
    content: values.content.trim() ? "" : "请输入复盘正文",
  }), [values]);

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">复盘记录</p>
          <h3>新增复盘笔记</h3>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        <FormMessage state={state} />
        <InstrumentSelect instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
        <div className="field-grid field-grid-2">
          <div>
            <input className="field" defaultValue={today} name="reviewDate" type="date" required />
            <FieldError message={firstFieldError(state, "reviewDate")} />
          </div>
          <div>
            <input className="field" name="mood" placeholder="情绪标签，例如 冷静 / 犹豫" />
            <FieldError message={firstFieldError(state, "mood")} />
          </div>
        </div>
        <div>
          <input
            className="field"
            name="title"
            placeholder="复盘标题"
            required
            onInput={(event) => setValues((prev) => ({ ...prev, title: event.currentTarget.value }))}
          />
          <FieldError message={clientErrors.title || firstFieldError(state, "title")} />
        </div>
        <div>
          <textarea
            className="field min-h-[110px]"
            name="content"
            placeholder="写下这次交易做得好的地方、踩坑点与认知变化"
            required
            onInput={(event) => setValues((prev) => ({ ...prev, content: event.currentTarget.value }))}
          />
          <FieldError message={clientErrors.content || firstFieldError(state, "content")} />
        </div>
        <div>
          <textarea className="field min-h-[88px]" name="actionPlan" placeholder="下一步行动计划，例如 等待回撤、分批止盈、暂停加仓" />
          <FieldError message={firstFieldError(state, "actionPlan")} />
        </div>
        <SubmitButton className="secondary-btn w-full" label="保存复盘" pendingLabel="正在保存..." />
      </form>
    </section>
  );
}

function roundShares(value: number) {
  return Math.round(value * 100) / 100;
}

type ShareCalculatorResult =
  | { kind: "error"; error: string }
  | {
      kind: "ready";
      nav: number;
      sellShares: number;
      estimatedSellAmount: number;
      remainingShares: number;
      remainingAmount: number;
    };

function ShareCalculatorPanel({ analytics }: { analytics: InstrumentAnalytics | null }) {
  const [navMode, setNavMode] = useState<"manual" | "derived">("manual");
  const [targetMode, setTargetMode] = useState<"sell" | "keep">("sell");
  const [manualNav, setManualNav] = useState(analytics?.currentPrice ? analytics.currentPrice.toFixed(4) : "");
  const [holdingAmount, setHoldingAmount] = useState(analytics?.marketValue ? analytics.marketValue.toFixed(2) : "");
  const [holdingShares, setHoldingShares] = useState(analytics?.quantityHeld ? analytics.quantityHeld.toFixed(2) : "");
  const [targetAmount, setTargetAmount] = useState("");

  const result = useMemo((): ShareCalculatorResult => {
    const amount = Number(holdingAmount || 0);
    const shares = Number(holdingShares || 0);
    const manualValue = Number(manualNav || 0);
    const target = Number(targetAmount || 0);

    if (navMode === "manual") {
      if (manualValue <= 0) {
        return { kind: "error", error: "请填写大于 0 的净值。" };
      }
    }

    if (navMode === "derived") {
      if (amount <= 0) {
        return { kind: "error", error: "持仓金额必须大于 0，才能反推净值。" };
      }
      if (shares <= 0) {
        return { kind: "error", error: "持有份额必须大于 0，才能反推净值。" };
      }
    }

    const nav = navMode === "manual" ? manualValue : amount / shares;
    if (nav <= 0) {
      return { kind: "error", error: "净值计算失败，请检查输入。" };
    }

    if (amount <= 0) {
      return { kind: "error", error: "当前持仓金额必须大于 0。" };
    }

    if (shares <= 0) {
      return { kind: "error", error: "当前持有份额必须大于 0。" };
    }

    if (target <= 0) {
      return { kind: "error", error: targetMode === "sell" ? "请输入想卖出的金额。" : "请输入卖出后想保留的金额。" };
    }

    const desiredSellAmount = targetMode === "sell" ? target : amount - target;
    if (targetMode === "sell" && target > amount) {
      return { kind: "error", error: "想卖出的金额不能超过当前持仓金额。" };
    }
    if (targetMode === "keep" && target >= amount) {
      return { kind: "error", error: "想保留的金额必须小于当前持仓金额。" };
    }
    if (desiredSellAmount <= 0) {
      return { kind: "error", error: "卖出金额必须大于 0。" };
    }

    const sellShares = roundShares(desiredSellAmount / nav);
    if (sellShares > shares) {
      return { kind: "error", error: "估算后卖出份额超过当前持仓份额，请检查输入。" };
    }

    const estimatedSellAmount = sellShares * nav;
    const remainingShares = Math.max(0, shares - sellShares);
    const remainingAmount = remainingShares * nav;

    return {
      kind: "ready",
      nav,
      sellShares,
      estimatedSellAmount,
      remainingShares,
      remainingAmount,
    };
  }, [holdingAmount, holdingShares, manualNav, navMode, targetAmount, targetMode]);

  return (
    <section className="panel space-y-4">
      <div className="section-header">
        <div>
          <p className="section-kicker">工具面板</p>
          <h3>基金卖出份额速算器</h3>
        </div>
      </div>

      <p className="text-sm leading-7 text-[var(--muted)]">
        {analytics ? `已带入 ${analytics.instrument.name} 的最新持仓数据，你也可以手工覆盖。` : "可直接填写当前持仓金额、份额和目标卖出金额，快速换算应该提交的卖出份额。"}
      </p>

      <div className="field-grid field-grid-2">
        <label className="tool-option">
          <input checked={navMode === "manual"} type="radio" name="navMode" onChange={() => setNavMode("manual")} />
          <span>直接填写净值</span>
        </label>
        <label className="tool-option">
          <input checked={navMode === "derived"} type="radio" name="navMode" onChange={() => setNavMode("derived")} />
          <span>根据金额和份额反推净值</span>
        </label>
      </div>

      {navMode === "manual" ? (
        <div>
          <input className="field" value={manualNav} onChange={(event) => setManualNav(event.currentTarget.value)} placeholder="当前净值，例如 1.2345" type="number" min="0" step="0.0001" />
        </div>
      ) : null}

      <div className="field-grid field-grid-2">
        <input className="field" value={holdingAmount} onChange={(event) => setHoldingAmount(event.currentTarget.value)} placeholder="当前持仓金额" type="number" min="0" step="0.01" />
        <input className="field" value={holdingShares} onChange={(event) => setHoldingShares(event.currentTarget.value)} placeholder="当前持有份额" type="number" min="0" step="0.01" />
      </div>

      <div className="field-grid field-grid-2">
        <label className="tool-option">
          <input checked={targetMode === "sell"} type="radio" name="targetMode" onChange={() => setTargetMode("sell")} />
          <span>我想卖出多少金额</span>
        </label>
        <label className="tool-option">
          <input checked={targetMode === "keep"} type="radio" name="targetMode" onChange={() => setTargetMode("keep")} />
          <span>卖出后想保留多少金额</span>
        </label>
      </div>

      <input className="field" value={targetAmount} onChange={(event) => setTargetAmount(event.currentTarget.value)} placeholder={targetMode === "sell" ? "目标卖出金额" : "目标保留金额"} type="number" min="0" step="0.01" />

      {result.kind === "error" ? (
        <div className="form-message" role="alert">
          <p>{result.error}</p>
        </div>
      ) : (
        <div className="space-y-3 rounded-[24px] bg-[rgba(30,63,102,0.05)] p-4">
          <div className="decision-row">
            <span>当前净值</span>
            <strong>{formatNumber(result.nav, 4)}</strong>
          </div>
          <div className="decision-row">
            <span>应卖份额</span>
            <strong>{formatNumber(result.sellShares, 2)} 份</strong>
          </div>
          <div className="decision-row">
            <span>估算卖出金额</span>
            <strong>{formatMoney(result.estimatedSellAmount, analytics?.instrument.currency ?? "CNY")}</strong>
          </div>
          <div className="decision-row">
            <span>剩余份额</span>
            <strong>{formatNumber(result.remainingShares, 2)} 份</strong>
          </div>
          <div className="decision-row">
            <span>剩余金额</span>
            <strong>{formatMoney(result.remainingAmount, analytics?.instrument.currency ?? "CNY")}</strong>
          </div>
        </div>
      )}

      <p className="text-xs leading-6 text-[var(--muted)]">
        结果按 0.01 份估算，不包含赎回费、到账延迟和未知确认净值偏差，实际成交请以平台确认结果为准。
      </p>
    </section>
  );
}

export function FormsPanel({ instruments, selectedInstrumentId, selectedAnalytics }: FormsPanelProps) {
  const hasInstruments = instruments.length > 0;

  return (
    <aside className="space-y-4">
      {!hasInstruments ? (
        <section className="panel space-y-4">
          <div className="section-header">
            <div>
              <p className="section-kicker">快速开始</p>
              <h3>一键载入演示数据</h3>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--muted)]">
            如果你想先看完整效果，可以先写入一套模拟交易数据，再替换成自己的真实记录。
          </p>
          <form action={seedDemoAction}>
            <SubmitButton className="primary-btn w-full" label="写入演示数据" pendingLabel="正在写入..." />
          </form>
        </section>
      ) : null}

      <InstrumentForm />
      <ShareCalculatorPanel key={selectedAnalytics?.instrument.id ?? "empty"} analytics={selectedAnalytics} />

      {hasInstruments ? (
        <>
          <TradeForm instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
          <SnapshotForm instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
          <ReviewForm instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
        </>
      ) : (
        <>
          <section className="panel">
            <p className="text-sm text-[var(--muted)]">请先创建至少一个标的，再录入交易流水。</p>
          </section>
          <section className="panel">
            <p className="text-sm text-[var(--muted)]">先创建标的后，价格快照才有落点。</p>
          </section>
          <section className="panel">
            <p className="text-sm text-[var(--muted)]">先创建标的，再沉淀属于自己的复盘档案。</p>
          </section>
        </>
      )}
    </aside>
  );
}
