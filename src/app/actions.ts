"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import {
  createInstrument,
  createReviewNote,
  createSnapshot,
  createTrade,
  getDashboardData,
  seedDemoData,
} from "@/lib/db/repository";
import { buildPortfolioOverview } from "@/lib/domain/analytics";
import { instrumentFormSchema, reviewFormSchema, snapshotFormSchema, tradeFormSchema } from "@/lib/forms/schemas";
import { type ActionFormState, initialActionFormState, type FormFieldErrors } from "@/lib/forms/state";

function redirectBack(instrumentId?: string | null) {
  revalidatePath("/");
  redirect(instrumentId ? `/?instrument=${instrumentId}` : "/");
}

function buildErrorState(error: unknown, fallbackMessage: string): ActionFormState {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "请修正表单中的错误后再提交。",
      fieldErrors: error.flatten().fieldErrors,
      formErrors: error.flatten().formErrors,
    };
  }

  return {
    success: false,
    message: fallbackMessage,
    fieldErrors: {},
    formErrors: [fallbackMessage],
  };
}

function toRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function validateTradeBusinessRules(input: ReturnType<typeof tradeFormSchema.parse>): Promise<FormFieldErrors | null> {
  const data = await getDashboardData();
  const overview = buildPortfolioOverview({
    ...data,
    selectedInstrumentId: input.instrumentId,
  });
  const analytics = overview.analyticsList.find((item) => item.instrument.id === input.instrumentId);

  if (!analytics) {
    const errors: FormFieldErrors = {
      instrumentId: ["标的不存在，请刷新页面后重试。"],
    };
    return errors;
  }

  if (input.tradeType === "SELL" && input.quantity > analytics.quantityHeld) {
    const errors: FormFieldErrors = {
      quantity: [`卖出数量不能超过当前持仓数量 ${analytics.quantityHeld.toFixed(2)}。`],
    };
    return errors;
  }

  return null;
}

export async function createInstrumentAction(
  _prevState: ActionFormState,
  formData: FormData,
): Promise<ActionFormState> {
  try {
    const parsed = instrumentFormSchema.parse(toRecord(formData));
    const instrumentId = await createInstrument(parsed);
    redirectBack(instrumentId);
  } catch (error) {
    return buildErrorState(error, "保存标的失败，请稍后重试。");
  }

  return initialActionFormState;
}

export async function createTradeAction(
  _prevState: ActionFormState,
  formData: FormData,
): Promise<ActionFormState> {
  try {
    const parsed = tradeFormSchema.parse(toRecord(formData));
    const businessErrors = await validateTradeBusinessRules(parsed);

    if (businessErrors) {
      return {
        ...initialActionFormState,
        message: "请修正交易数据后再提交。",
        fieldErrors: businessErrors,
        formErrors: [],
      };
    }

    await createTrade(parsed);
    redirectBack(parsed.instrumentId);
  } catch (error) {
    return buildErrorState(error, "写入交易失败，请稍后重试。");
  }

  return initialActionFormState;
}

export async function createSnapshotAction(
  _prevState: ActionFormState,
  formData: FormData,
): Promise<ActionFormState> {
  try {
    const parsed = snapshotFormSchema.parse(toRecord(formData));
    await createSnapshot(parsed);
    redirectBack(parsed.instrumentId);
  } catch (error) {
    return buildErrorState(error, "保存价格快照失败，请稍后重试。");
  }

  return initialActionFormState;
}

export async function createReviewAction(
  _prevState: ActionFormState,
  formData: FormData,
): Promise<ActionFormState> {
  try {
    const parsed = reviewFormSchema.parse(toRecord(formData));
    await createReviewNote(parsed);
    redirectBack(parsed.instrumentId);
  } catch (error) {
    return buildErrorState(error, "保存复盘记录失败，请稍后重试。");
  }

  return initialActionFormState;
}

export async function seedDemoAction() {
  const instrumentId = await seedDemoData();
  redirectBack(instrumentId);
}
