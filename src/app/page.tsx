export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1180px] items-center px-4 py-10 lg:px-6">
      <section className="panel panel-hero w-full space-y-8">
        <div className="space-y-4">
          <p className="section-kicker">StockHunter</p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-[var(--ink-strong)] lg:text-7xl">
            从空仓库起步，搭一个真正面向交易复盘的个人系统。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
            当前版本已经完成工程基础设施初始化。下一步会继续补齐交易数据模型、成本分析引擎、复盘工作台以及完整的操作文档。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="metric-block">
            <p className="metric-label">当前阶段</p>
            <p className="metric-value">工程骨架</p>
            <p className="metric-hint">Next.js、类型系统、样式基底与配置规范已经就位。</p>
          </div>
          <div className="metric-block">
            <p className="metric-label">下一阶段</p>
            <p className="metric-value">核心数据层</p>
            <p className="metric-hint">补上交易账本、价格快照、复盘笔记与成本计算逻辑。</p>
          </div>
          <div className="metric-block">
            <p className="metric-label">最终目标</p>
            <p className="metric-value">决策工作台</p>
            <p className="metric-hint">让每次买卖都有记录、有依据、可回放、可推演。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
