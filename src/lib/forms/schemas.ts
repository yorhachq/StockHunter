import { z } from "zod";
import { assetTypes, tradeTypes } from "@/lib/domain/types";

function toTrimmedString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function toUppercaseString(value: unknown) {
  return toTrimmedString(value).toUpperCase();
}

function toNumberValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const text = toTrimmedString(value);
  if (!text) {
    return Number.NaN;
  }

  return Number(text);
}

function toOptionalNumberValue(value: unknown) {
  const text = toTrimmedString(value);
  if (!text) {
    return null;
  }

  return Number(text);
}

function toConfidenceValue(value: unknown) {
  const text = toTrimmedString(value);
  if (!text) {
    return null;
  }

  return Number(text);
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请输入有效日期");
const optionalTextSchema = z.preprocess((value) => {
  const text = toTrimmedString(value);
  return text ? text : undefined;
}, z.string().optional());
const requiredTextSchema = (message: string) =>
  z.preprocess((value) => toTrimmedString(value), z.string().min(1, message));
const uppercaseTextSchema = (message: string) =>
  z.preprocess((value) => toUppercaseString(value), z.string().min(1, message));
const positiveNumberSchema = (message: string) =>
  z.preprocess((value) => toNumberValue(value), z.number({ message }).positive(message));
const nonNegativeNumberSchema = (message: string) =>
  z.preprocess((value) => toNumberValue(value), z.number({ message }).nonnegative(message));
const ratioSchema = (message: string) =>
  positiveNumberSchema(message).refine((value) => value < 1, "该比例必须小于 1");
const optionalPositiveNumberSchema = () =>
  z.preprocess((value) => toOptionalNumberValue(value), z.number().positive("请输入大于 0 的数值").nullable());
const optionalNonNegativeNumberSchema = () =>
  z.preprocess((value) => toOptionalNumberValue(value), z.number().nonnegative("请输入不小于 0 的数值").nullable());

export const instrumentFormSchema = z.object({
  symbol: uppercaseTextSchema("请输入代码"),
  name: requiredTextSchema("请输入名称"),
  market: uppercaseTextSchema("请输入市场"),
  assetType: z.enum(assetTypes, { message: "请选择资产类型" }),
  currency: uppercaseTextSchema("请输入币种"),
  notes: optionalTextSchema,
  targetPositionAmount: nonNegativeNumberSchema("请输入目标持仓金额"),
  maxPositionAmount: nonNegativeNumberSchema("请输入最大持仓金额"),
  buyStepRatio: ratioSchema("请输入买入步长"),
  sellStepRatio: ratioSchema("请输入卖出步长"),
  reboundRatio: ratioSchema("请输入反弹确认比例"),
}).superRefine((value, ctx) => {
  if (value.targetPositionAmount > value.maxPositionAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetPositionAmount"],
      message: "目标持仓金额不能大于最大持仓金额",
    });
  }
});

export const tradeFormSchema = z.object({
  instrumentId: z.string().uuid("标的不存在，请刷新后重试"),
  tradeDate: dateSchema,
  tradeType: z.enum(tradeTypes, { message: "请选择交易类型" }),
  quantity: nonNegativeNumberSchema("请输入数量"),
  price: nonNegativeNumberSchema("请输入价格"),
  fee: nonNegativeNumberSchema("请输入手续费"),
  tax: nonNegativeNumberSchema("请输入税费"),
  cashAmount: nonNegativeNumberSchema("请输入现金金额"),
  reason: optionalTextSchema,
  thesis: optionalTextSchema,
  confidence: z.preprocess((value) => toConfidenceValue(value), z.number().int("信心分必须是整数").min(1, "信心分最低 1 分").max(5, "信心分最高 5 分").nullable()),
}).superRefine((value, ctx) => {
  if ((value.tradeType === "BUY" || value.tradeType === "SELL") && value.quantity <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantity"],
      message: `${value.tradeType === "BUY" ? "买入" : "卖出"}数量必须大于 0`,
    });
  }

  if ((value.tradeType === "BUY" || value.tradeType === "SELL") && value.price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: `${value.tradeType === "BUY" ? "买入" : "卖出"}价格必须大于 0`,
    });
  }

  if (value.tradeType === "DIVIDEND" && value.cashAmount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cashAmount"],
      message: "分红到账金额必须大于 0",
    });
  }

  if (value.tradeType === "BONUS" && value.quantity <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantity"],
      message: "送股数量必须大于 0",
    });
  }
});

export const snapshotFormSchema = z.object({
  instrumentId: z.string().uuid("标的不存在，请刷新后重试"),
  snapshotDate: dateSchema,
  closePrice: positiveNumberSchema("请输入收盘价或参考价"),
  highPrice: optionalPositiveNumberSchema(),
  lowPrice: optionalPositiveNumberSchema(),
  volume: optionalNonNegativeNumberSchema(),
  note: optionalTextSchema,
}).superRefine((value, ctx) => {
  if (value.highPrice !== null && value.lowPrice !== null && value.highPrice < value.lowPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["highPrice"],
      message: "最高价不能低于最低价",
    });
  }

  if (value.highPrice !== null && value.closePrice > value.highPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["closePrice"],
      message: "收盘价不能高于最高价",
    });
  }

  if (value.lowPrice !== null && value.closePrice < value.lowPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["closePrice"],
      message: "收盘价不能低于最低价",
    });
  }
});

export const reviewFormSchema = z.object({
  instrumentId: z.string().uuid("标的不存在，请刷新后重试"),
  reviewDate: dateSchema,
  title: requiredTextSchema("请输入复盘标题"),
  mood: optionalTextSchema,
  content: requiredTextSchema("请输入复盘正文"),
  actionPlan: optionalTextSchema,
});

export type InstrumentFormValues = z.infer<typeof instrumentFormSchema>;
export type TradeFormValues = z.infer<typeof tradeFormSchema>;
export type SnapshotFormValues = z.infer<typeof snapshotFormSchema>;
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
