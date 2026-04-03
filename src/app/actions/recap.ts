"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  recap,
  recapAnswer,
  recapQuestion,
  recapTemplate,
  promptRule,
  sm,
  store,
} from "@/db/schema";
import { eq, and, desc, lte, isNull, or, sql } from "drizzle-orm";

function getCurrentWeekEnding(): string {
  const now = new Date();
  const day = now.getDay();
  // Week ending = next Sunday (or today if Sunday)
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  return sunday.toISOString().split("T")[0];
}

export async function getSmContext() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "sm") {
    throw new Error("Unauthorized");
  }

  const entityId = (session.user as any).entityId;

  // Get SM with store info
  const [smRecord] = await db
    .select({
      sm: sm,
      store: store,
    })
    .from(sm)
    .innerJoin(store, eq(store.id, sm.storeId))
    .where(eq(sm.id, entityId))
    .limit(1);

  if (!smRecord) throw new Error("SM not found");

  return { sm: smRecord.sm, store: smRecord.store };
}

export async function getTemplateQuestions(storeId: string, smId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Get active templates: standard (no store/sm) + store-specific + sm-specific
  const templates = await db
    .select()
    .from(recapTemplate)
    .where(
      and(
        eq(recapTemplate.active, true),
        lte(recapTemplate.effectiveFrom, today),
        or(isNull(recapTemplate.effectiveTo), sql`${recapTemplate.effectiveTo} >= ${today}`)
      )
    );

  // Filter: standard templates (for this RM) + store-specific + sm-specific
  const relevantTemplates = templates.filter(
    (t) =>
      (t.templateType === "standard" && !t.storeId && !t.smId) ||
      (t.storeId === storeId) ||
      (t.smId === smId)
  );

  // Get questions for all relevant templates, ordered
  const templateIds = relevantTemplates.map((t) => t.id);
  if (templateIds.length === 0) return [];

  const questions = await db
    .select({
      question: recapQuestion,
      templateName: recapTemplate.name,
      templateType: recapTemplate.templateType,
    })
    .from(recapQuestion)
    .innerJoin(recapTemplate, eq(recapTemplate.id, recapQuestion.templateId))
    .where(sql`${recapQuestion.templateId} IN ${templateIds}`)
    .orderBy(recapTemplate.templateType, recapQuestion.sortOrder);

  return questions;
}

export async function getPromptRules(rmId: string) {
  return db
    .select()
    .from(promptRule)
    .where(and(eq(promptRule.rmId, rmId), eq(promptRule.active, true)));
}

export async function getCurrentRecap(smId: string, storeId: string) {
  const weekEnding = getCurrentWeekEnding();

  const [existing] = await db
    .select()
    .from(recap)
    .where(
      and(
        eq(recap.smId, smId),
        eq(recap.storeId, storeId),
        eq(recap.weekEnding, weekEnding)
      )
    )
    .limit(1);

  return existing ?? null;
}

export async function getRecapAnswers(recapId: string) {
  return db
    .select()
    .from(recapAnswer)
    .where(eq(recapAnswer.recapId, recapId));
}

export async function getPastRecaps(smId: string, limit = 8) {
  const weekEnding = getCurrentWeekEnding();

  const recaps = await db
    .select({
      recap: recap,
      storeName: store.name,
    })
    .from(recap)
    .innerJoin(store, eq(store.id, recap.storeId))
    .where(
      and(eq(recap.smId, smId), sql`${recap.weekEnding} < ${weekEnding}`)
    )
    .orderBy(desc(recap.weekEnding))
    .limit(limit);

  // For each past recap, get answers with questions
  const result = [];
  for (const r of recaps) {
    const answers = await db
      .select({
        answer: recapAnswer,
        questionText: recapQuestion.questionText,
      })
      .from(recapAnswer)
      .innerJoin(recapQuestion, eq(recapQuestion.id, recapAnswer.questionId))
      .where(eq(recapAnswer.recapId, r.recap.id))
      .orderBy(recapQuestion.sortOrder);

    result.push({
      ...r.recap,
      storeName: r.storeName,
      answers: answers.map((a) => ({
        questionText: a.questionText,
        answerText: a.answer.answerText,
      })),
    });
  }

  return result;
}

export async function saveRecapAnswers(
  smId: string,
  storeId: string,
  answers: { questionId: string; answerText: string }[],
  status: "draft" | "submitted"
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "sm") {
    throw new Error("Unauthorized");
  }

  const weekEnding = getCurrentWeekEnding();

  // Upsert recap
  let [existing] = await db
    .select()
    .from(recap)
    .where(
      and(
        eq(recap.smId, smId),
        eq(recap.storeId, storeId),
        eq(recap.weekEnding, weekEnding)
      )
    )
    .limit(1);

  if (!existing) {
    [existing] = await db
      .insert(recap)
      .values({ weekEnding, status, smId, storeId })
      .returning();
  } else {
    await db
      .update(recap)
      .set({ status, updatedAt: new Date() })
      .where(eq(recap.id, existing.id));
  }

  // Delete existing answers and insert new ones
  await db.delete(recapAnswer).where(eq(recapAnswer.recapId, existing.id));

  if (answers.length > 0) {
    await db.insert(recapAnswer).values(
      answers.map((a) => ({
        recapId: existing.id,
        questionId: a.questionId,
        answerText: a.answerText,
      }))
    );
  }

  return existing;
}
