import {
  createInstrumentAction,
  createReviewAction,
  createSnapshotAction,
  createTradeAction,
  seedDemoAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { assetTypes, tradeTypes, type InstrumentRow } from "@/lib/domain/types";

type FormsPanelProps = {
  instruments: InstrumentRow[];
  selectedInstrumentId: string | null;
};

const today = new Date().toISOString().slice(0, 10);

function InstrumentSelect({ instruments, selectedInstrumentId }: { instruments: InstrumentRow[]; selectedInstrumentId: string | null }) {
  const fallbackId = selectedInstrumentId ?? instruments[0]?.id ?? "";

  return (
    <select className="field" defaultValue={fallbackId} name="instrumentId" required>
      {instruments.map((instrument) => (
        <option key={instrument.id} value={instrument.id}>
          {instrument.name} ({instrument.symbol})
        </option>
      ))}
    </select>
  );
}

export function FormsPanel({ instruments, selectedInstrumentId }: FormsPanelProps) {
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

      <section className="panel space-y-4">
        <div className="section-header">
          <div>
            <p className="section-kicker">基础配置</p>
            <h3>新增交易标的</h3>
          </div>
        </div>
        <form action={createInstrumentAction} className="space-y-3">
          <div className="field-grid field-grid-2">
            <input className="field" name="symbol" placeholder="代码，例如 513100" required />
            <input className="field" name="name" placeholder="名称，例如 纳指 ETF" required />
          </div>
          <div className="field-grid field-grid-3">
            <input className="field" defaultValue="CN" name="market" placeholder="市场" required />
            <select className="field" defaultValue="ETF" name="assetType" required>
              {assetTypes.map((assetType) => (
                <option key={assetType} value={assetType}>
                  {assetType}
                </option>
              ))}
            </select>
            <input className="field" defaultValue="CNY" name="currency" placeholder="币种" required />
          </div>
          <div className="field-grid field-grid-2">
            <input className="field" defaultValue="30000" min="0" name="targetPositionAmount" placeholder="目标持仓金额" step="0.01" type="number" required />
            <input className="field" defaultValue="50000" min="0" name="maxPositionAmount" placeholder="最大持仓金额" step="0.01" type="number" required />
          </div>
          <div className="field-grid field-grid-3">
            <input className="field" defaultValue="0.04" max="1" min="0" name="buyStepRatio" placeholder="买入步长" step="0.001" type="number" required />
            <input className="field" defaultValue="0.06" max="1" min="0" name="sellStepRatio" placeholder="卖出步长" step="0.001" type="number" required />
            <input className="field" defaultValue="0.03" max="1" min="0" name="reboundRatio" placeholder="反弹确认" step="0.001" type="number" required />
          </div>
          <textarea className="field min-h-[84px]" name="notes" placeholder="补充长期投资逻辑、风控原则或观察点" />
          <SubmitButton className="primary-btn w-full" label="保存标的" pendingLabel="正在保存..." />
        </form>
      </section>

      <section className="panel space-y-4">
        <div className="section-header">
          <div>
            <p className="section-kicker">交易录入</p>
            <h3>新增交易流水</h3>
          </div>
        </div>
        {hasInstruments ? (
          <form action={createTradeAction} className="space-y-3">
            <InstrumentSelect instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
            <div className="field-grid field-grid-2">
              <input className="field" defaultValue={today} name="tradeDate" type="date" required />
              <select className="field" defaultValue="BUY" name="tradeType" required>
                {tradeTypes.map((tradeType) => (
                  <option key={tradeType} value={tradeType}>
                    {tradeType}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-grid field-grid-2">
              <input className="field" defaultValue="0" min="0" name="quantity" step="0.0001" type="number" placeholder="数量" required />
              <input className="field" defaultValue="0" min="0" name="price" step="0.0001" type="number" placeholder="价格" required />
            </div>
            <div className="field-grid field-grid-3">
              <input className="field" defaultValue="0" min="0" name="fee" step="0.01" type="number" placeholder="手续费" required />
              <input className="field" defaultValue="0" min="0" name="tax" step="0.01" type="number" placeholder="税费" required />
              <input className="field" defaultValue="0" min="0" name="cashAmount" step="0.01" type="number" placeholder="现金金额" required />
            </div>
            <input className="field" name="reason" placeholder="触发原因，例如 回撤补仓 / 达到目标收益" />
            <textarea className="field min-h-[88px]" name="thesis" placeholder="详细描述本次交易的判断、计划与预期" />
            <select className="field" defaultValue="3" name="confidence">
              <option value="">不记录信心分</option>
              <option value="1">1 分</option>
              <option value="2">2 分</option>
              <option value="3">3 分</option>
              <option value="4">4 分</option>
              <option value="5">5 分</option>
            </select>
            <SubmitButton className="primary-btn w-full" label="写入交易" pendingLabel="正在写入..." />
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">请先创建至少一个标的，再录入交易流水。</p>
        )}
      </section>

      <section className="panel space-y-4">
        <div className="section-header">
          <div>
            <p className="section-kicker">行情补录</p>
            <h3>新增价格快照</h3>
          </div>
        </div>
        {hasInstruments ? (
          <form action={createSnapshotAction} className="space-y-3">
            <InstrumentSelect instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
            <div className="field-grid field-grid-2">
              <input className="field" defaultValue={today} name="snapshotDate" type="date" required />
              <input className="field" defaultValue="0" min="0.0001" name="closePrice" step="0.0001" type="number" placeholder="收盘价/参考价" required />
            </div>
            <div className="field-grid field-grid-3">
              <input className="field" min="0" name="highPrice" step="0.0001" type="number" placeholder="最高价" />
              <input className="field" min="0" name="lowPrice" step="0.0001" type="number" placeholder="最低价" />
              <input className="field" min="0" name="volume" step="0.01" type="number" placeholder="成交量" />
            </div>
            <textarea className="field min-h-[72px]" name="note" placeholder="记录价格异动、消息面或技术形态备注" />
            <SubmitButton className="secondary-btn w-full" label="保存价格快照" pendingLabel="正在保存..." />
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">先创建标的后，价格快照才有落点。</p>
        )}
      </section>

      <section className="panel space-y-4">
        <div className="section-header">
          <div>
            <p className="section-kicker">复盘记录</p>
            <h3>新增复盘笔记</h3>
          </div>
        </div>
        {hasInstruments ? (
          <form action={createReviewAction} className="space-y-3">
            <InstrumentSelect instruments={instruments} selectedInstrumentId={selectedInstrumentId} />
            <div className="field-grid field-grid-2">
              <input className="field" defaultValue={today} name="reviewDate" type="date" required />
              <input className="field" name="mood" placeholder="情绪标签，例如 冷静 / 犹豫" />
            </div>
            <input className="field" name="title" placeholder="复盘标题" required />
            <textarea className="field min-h-[110px]" name="content" placeholder="写下这次交易做得好的地方、踩坑点与认知变化" required />
            <textarea className="field min-h-[88px]" name="actionPlan" placeholder="下一步行动计划，例如 等待回撤、分批止盈、暂停加仓" />
            <SubmitButton className="secondary-btn w-full" label="保存复盘" pendingLabel="正在保存..." />
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">先创建标的，再沉淀属于自己的复盘档案。</p>
        )}
      </section>
    </aside>
  );
}
