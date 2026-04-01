"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createInstrument, createReviewNote, createSnapshot, createTrade, seedDemoData } from "@/lib/db/repository";
import { assetTypes, tradeTypes } from "@/lib/domain/types";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const raw = getString(formData, key);
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function redirectBack(instrumentId?: string | null) {
  revalidatePath("/");
  redirect(instrumentId ? `/?instrument=${instrumentId}` : "/");
}

const instrumentSchema = z.object({
  symbol: z.string().min(1, "请输入代码"),
  name: z.string().min(1, "请输入名称"),
  market: z.string().min(1, "请输入市场"),
  assetType: z.enum(assetTypes),
  currency: z.string().min(1, "请输入币种"),
  notes: z.string().optional(),
  targetPositionAmount: z.number().nonnegative(),
  maxPositionAmount: z.number().nonnegative(),
  buyStepRatio: z.number().min(0).max(1),
  sellStepRatio: z.number().min(0).max(1),
  reboundRatio: z.number().min(0).max(1),
});

const tradeSchema = z.object({
  instrumentId: z.string().uuid(),
  tradeDate: z.string().min(1),
  tradeType: z.enum(tradeTypes),
  quantity: z.number().nonnegative(),
  price: z.number().nonnegative(),
  fee: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  cashAmount: z.number().nonnegative(),
  reason: z.string().optional(),
  thesis: z.string().optional(),
  confidence: z.number().int().min(1).max(5).nullable(),
});

const snapshotSchema = z.object({
  instrumentId: z.string().uuid(),
  snapshotDate: z.string().min(1),
  closePrice: z.number().positive(),
  highPrice: z.number().positive().nullable(),
  lowPrice: z.number().positive().nullable(),
  volume: z.number().nonnegative().nullable(),
  note: z.string().optional(),
});

const reviewSchema = z.object({
  instrumentId: z.string().uuid(),
  reviewDate: z.string().min(1),
  title: z.string().min(1),
  mood: z.string().optional(),
  content: z.string().min(1),
  actionPlan: z.string().optional(),
});

export async function createInstrumentAction(formData: FormData) {
  const parsed = instrumentSchema.parse({
    symbol: getString(formData, "symbol"),
    name: getString(formData, "name"),
    market: getString(formData, "market"),
    assetType: getString(formData, "assetType"),
    currency: getString(formData, "currency"),
    notes: getString(formData, "notes"),
    targetPositionAmount: getNumber(formData, "targetPositionAmount"),
    maxPositionAmount: getNumber(formData, "maxPositionAmount"),
    buyStepRatio: getNumber(formData, "buyStepRatio"),
    sellStepRatio: getNumber(formData, "sellStepRatio"),
    reboundRatio: getNumber(formData, "reboundRatio"),
  });

  const instrumentId = await createInstrument(parsed);
  redirectBack(instrumentId);
}

export async function createTradeAction(formData: FormData) {
  const parsed = tradeSchema.parse({
    instrumentId: getString(formData, "instrumentId"),
    tradeDate: getString(formData, "tradeDate"),
    tradeType: getString(formData, "tradeType"),
    quantity: getNumber(formData, "quantity"),
    price: getNumber(formData, "price"),
    fee: getNumber(formData, "fee"),
    tax: getNumber(formData, "tax"),
    cashAmount: getNumber(formData, "cashAmount"),
    reason: getString(formData, "reason"),
    thesis: getString(formData, "thesis"),
    confidence: getString(formData, "confidence") ? getNumber(formData, "confidence") : null,
  });

  await createTrade(parsed);
  redirectBack(parsed.instrumentId);
}

export async function createSnapshotAction(formData: FormData) {
  const parsed = snapshotSchema.parse({
    instrumentId: getString(formData, "instrumentId"),
    snapshotDate: getString(formData, "snapshotDate"),
    closePrice: getNumber(formData, "closePrice"),
    highPrice: getString(formData, "highPrice") ? getNumber(formData, "highPrice") : null,
    lowPrice: getString(formData, "lowPrice") ? getNumber(formData, "lowPrice") : null,
    volume: getString(formData, "volume") ? getNumber(formData, "volume") : null,
    note: getString(formData, "note"),
  });

  await createSnapshot(parsed);
  redirectBack(parsed.instrumentId);
}

export async function createReviewAction(formData: FormData) {
  const parsed = reviewSchema.parse({
    instrumentId: getString(formData, "instrumentId"),
    reviewDate: getString(formData, "reviewDate"),
    title: getString(formData, "title"),
    mood: getString(formData, "mood"),
    content: getString(formData, "content"),
    actionPlan: getString(formData, "actionPlan"),
  });

  await createReviewNote(parsed);
  redirectBack(parsed.instrumentId);
}

export async function seedDemoAction() {
  const instrumentId = await seedDemoData();
  redirectBack(instrumentId);
}
