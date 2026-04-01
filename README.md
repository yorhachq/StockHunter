# StockHunter

StockHunter 是一个面向个人投资者的交易记录与复盘系统，用来记录基金/股票/ETF 的每一笔操作，计算动态持仓成本，沉淀交易理由，并根据你的历史行为与策略参数推演更合适的买入/卖出观察区间。

## 核心能力

- 交易账本：记录买入、卖出、分红、送股等动作
- 成本分析：自动计算持仓数量、动态成本、已实现收益、浮动盈亏
- 价格快照：手工补录关键时点价格，构建价格与成本同屏对照
- 复盘档案：把交易原因、信心分、情绪标签和行动计划沉淀下来
- 决策辅助：根据成本线、波动率和仓位策略推演买入带与卖出带
- 演示数据：提供一键体验入口，方便先看完整效果再录入自己的数据

## 技术栈

- 前端：Next.js App Router + React 19 + TypeScript
- 样式：Tailwind CSS 4 + 自定义设计语言
- 数据库：SQLite（基于 Node.js 内置 `node:sqlite`，默认本地文件持久化）
- 校验：Zod
- 运行脚本：tsx

## 目录结构

```text
src/
  app/                  路由、布局、Server Action
  components/           仪表盘、图表、表单组件
  config/               应用配置解析
  lib/db/               数据库初始化、Schema、仓储层
  lib/domain/           成本分析、格式化、领域类型
docs/                   需求说明与操作指南
scripts/                演示数据和重置脚本
```

## 本地启动

1. 安装依赖

```bash
pnpm install
```

2. 复制配置

```bash
cp .env.example .env.local
```

3. 可选：写入演示数据

```bash
pnpm db:seed
```

4. 启动开发环境

```bash
pnpm dev
```

5. 打开浏览器访问 `http://localhost:3000`

## 常用命令

```bash
pnpm dev        # 本地开发
pnpm lint       # ESLint 校验
pnpm typecheck  # TypeScript 校验
pnpm build      # 生产构建
pnpm db:seed    # 写入演示数据
pnpm db:reset   # 清空数据库表
```

## 录入真实数据的建议顺序

1. 先创建标的，填好市场、币种和仓位策略参数
2. 回补历史交易流水，确保买入/卖出/分红记录完整
3. 补录关键价格快照，至少把重要拐点和当前参考价录进去
4. 在关键决策后写复盘笔记，沉淀原因、情绪和下一步计划

## 文档

- [需求功能说明](./docs/需求功能说明.md)
- [操作指南](./docs/操作指南.md)
