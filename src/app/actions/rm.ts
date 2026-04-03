"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  rm,
  store,
  sm,
  recap,
  recapAnswer,
  recapQuestion,
  recapTemplate,
  consolidatedRecap,
  recapLineItem,
  promptRule,
  adNote,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function getCurrentWeekEnding(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  return sunday.toISOString().split("T")[0];
}

export async function getRmContext() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }
  const entityId = (session.user as any).entityId;

  const [rmRecord] = await db
    .select()
    .from(rm)
    .where(eq(rm.id, entityId))
    .limit(1);

  if (!rmRecord) throw new Error("RM not found");
  return rmRecord;
}

export async function getRmStores(regionId: string) {
  return db.select().from(store).where(eq(store.regionId, regionId));
}

export async function getStoreManagers(storeIds: string[]) {
  if (storeIds.length === 0) return [];
  return db
    .select()
    .from(sm)
    .where(sql`${sm.storeId} IN ${storeIds}`);
}

export async function getStoreRecapsForWeek(storeIds: string[]) {
  if (storeIds.length === 0) return [];
  const weekEnding = getCurrentWeekEnding();

  const recaps = await db
    .select({
      recap: recap,
      smName: sm.name,
      storeName: store.name,
    })
    .from(recap)
    .innerJoin(sm, eq(sm.id, recap.smId))
    .innerJoin(store, eq(store.id, recap.storeId))
    .where(
      and(
        sql`${recap.storeId} IN ${storeIds}`,
        eq(recap.weekEnding, weekEnding)
      )
    );

  // Get answers for each recap
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
      smName: r.smName,
      storeName: r.storeName,
      answers: answers.map((a) => ({
        questionText: a.questionText,
        answerText: a.answer.answerText,
      })),
    });
  }

  return result;
}

export async function getRmConsolidatedRecap(rmId: string) {
  const weekEnding = getCurrentWeekEnding();
  const [existing] = await db
    .select()
    .from(consolidatedRecap)
    .where(
      and(
        eq(consolidatedRecap.rmId, rmId),
        eq(consolidatedRecap.weekEnding, weekEnding)
      )
    )
    .limit(1);
  return existing ?? null;
}

export async function saveConsolidatedRecap(
  rmId: string,
  summary: string,
  status: "draft" | "submitted",
  recapIds: string[]
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }

  const weekEnding = getCurrentWeekEnding();

  let [existing] = await db
    .select()
    .from(consolidatedRecap)
    .where(
      and(
        eq(consolidatedRecap.rmId, rmId),
        eq(consolidatedRecap.weekEnding, weekEnding)
      )
    )
    .limit(1);

  if (!existing) {
    [existing] = await db
      .insert(consolidatedRecap)
      .values({ weekEnding, summary, status, rmId })
      .returning();
  } else {
    await db
      .update(consolidatedRecap)
      .set({ summary, status, updatedAt: new Date() })
      .where(eq(consolidatedRecap.id, existing.id));
  }

  // Update line items
  await db
    .delete(recapLineItem)
    .where(eq(recapLineItem.consolidatedRecapId, existing.id));

  if (recapIds.length > 0) {
    await db.insert(recapLineItem).values(
      recapIds.map((recapId) => ({
        consolidatedRecapId: existing.id,
        recapId,
      }))
    );
  }

  return existing;
}

export async function getAdNotesForRm(rmId: string) {
  const weekEnding = getCurrentWeekEnding();

  // Get consolidated recap for this week
  const [consolidated] = await db
    .select()
    .from(consolidatedRecap)
    .where(
      and(
        eq(consolidatedRecap.rmId, rmId),
        eq(consolidatedRecap.weekEnding, weekEnding)
      )
    )
    .limit(1);

  if (!consolidated) return [];

  return db
    .select()
    .from(adNote)
    .where(eq(adNote.consolidatedRecapId, consolidated.id))
    .orderBy(desc(adNote.createdAt));
}

// ── Template & Question management ──────────────────────────────

export async function getRmTemplates(rmId: string) {
  return db
    .select()
    .from(recapTemplate)
    .where(eq(recapTemplate.rmId, rmId))
    .orderBy(recapTemplate.templateType, recapTemplate.name);
}

export async function getTemplateQuestionsList(templateId: string) {
  return db
    .select()
    .from(recapQuestion)
    .where(eq(recapQuestion.templateId, templateId))
    .orderBy(recapQuestion.sortOrder);
}

export async function createTemplate(data: {
  name: string;
  templateType: string;
  rmId: string;
  storeId?: string;
  smId?: string;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }

  const [created] = await db
    .insert(recapTemplate)
    .values({
      ...data,
      effectiveFrom: new Date().toISOString().split("T")[0],
      active: true,
    })
    .returning();

  return created;
}

export async function addQuestion(data: {
  templateId: string;
  questionText: string;
  questionType: "text" | "number" | "scale";
  sortOrder: number;
  required: boolean;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }

  const [created] = await db
    .insert(recapQuestion)
    .values(data)
    .returning();

  return created;
}

export async function deleteQuestion(questionId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }

  await db.delete(recapQuestion).where(eq(recapQuestion.id, questionId));
}

export async function getRmPromptRules(rmId: string) {
  return db
    .select()
    .from(promptRule)
    .where(eq(promptRule.rmId, rmId))
    .orderBy(promptRule.ruleType);
}

export async function savePromptRule(data: {
  rmId: string;
  ruleType: string;
  value: string;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }

  const [created] = await db
    .insert(promptRule)
    .values({ ...data, active: true })
    .returning();

  return created;
}

export async function deletePromptRule(ruleId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") {
    throw new Error("Unauthorized");
  }

  await db.delete(promptRule).where(eq(promptRule.id, ruleId));
}

// ── Consolidation prompt ──────────────────────────────────────

export async function generateConsolidationPrompt(rmId: string) {
  const rmRecord = await getRmContext();
  const stores = await getRmStores(rmRecord.regionId);
  const storeIds = stores.map((s) => s.id);
  const storeRecaps = await getStoreRecapsForWeek(storeIds);
  const weekEnding = getCurrentWeekEnding();

  const lines: string[] = [];
  lines.push(`Regional Consolidation Recap`);
  lines.push(`Week ending: ${weekEnding}`);
  lines.push(`Region: ${stores.length} stores`);
  lines.push("");

  if (storeRecaps.length === 0) {
    lines.push("No store recaps submitted yet for this week.");
    return lines.join("\n");
  }

  lines.push(
    "Below are the individual store recaps. Summarize key themes, highlight standout performance, flag concerns, and identify action items."
  );
  lines.push("");

  for (const r of storeRecaps) {
    lines.push(`--- ${r.storeName} (${r.smName}) [${r.status}] ---`);
    for (const a of r.answers) {
      lines.push(`Q: ${a.questionText}`);
      lines.push(`A: ${a.answerText || "—"}`);
      lines.push("");
    }
    lines.push("");
  }

  lines.push("Please produce a consolidated summary covering:");
  lines.push("1. Overall regional performance and trends");
  lines.push("2. Standout stores or wins");
  lines.push("3. Concerns or recurring issues across stores");
  lines.push("4. Recommended actions or focus areas for next week");

  return lines.join("\n");
}
