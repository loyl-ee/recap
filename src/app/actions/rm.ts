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
  rmNote,
  rmSmNote,
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

  // Get RM's private notes for these recaps
  const recapIds = storeRecaps.map((r) => r.id);
  const myNotes = recapIds.length > 0 ? await getRmNotesForWeek(rmId, recapIds) : [];

  const lines: string[] = [];
  lines.push(
    `You are a business writing assistant helping a regional manager consolidate weekly store recaps into a single regional summary for the week ending ${weekEnding}. This region has ${stores.length} stores.`
  );
  lines.push("");

  if (storeRecaps.length === 0) {
    lines.push("No store recaps have been submitted yet for this week. Let me know when they're in and I'll help you consolidate.");
    return lines.join("\n");
  }

  lines.push(
    `I have ${storeRecaps.length} store recaps below. Help me synthesize these into a consolidated regional recap that my area director can read in under 2 minutes. Pull out the signal — what matters, what's trending, what needs attention.`
  );
  lines.push("");

  for (const r of storeRecaps) {
    lines.push(`--- ${r.storeName} (${r.smName}) [${r.status}] ---`);
    for (const a of r.answers) {
      lines.push(`Q: ${a.questionText}`);
      lines.push(`A: ${a.answerText || "—"}`);
      lines.push("");
    }

    // Include RM's notes for this store
    const storeNotes = myNotes.filter((n) => n.note.recapId === r.id);
    if (storeNotes.length > 0) {
      lines.push("MY NOTES ON THIS STORE:");
      for (const n of storeNotes) {
        lines.push(`• ${n.note.noteText}`);
      }
      lines.push("");
    }

    lines.push("");
  }

  lines.push("Produce a consolidated summary structured as:");
  lines.push("1. Overall regional performance — the headline");
  lines.push("2. Wins — standout stores or results worth calling out");
  lines.push("3. Concerns — recurring issues, stores that need support, red flags");
  lines.push("4. Focus for next week — what I should be driving across the region");
  lines.push("");
  lines.push("Pay special attention to MY NOTES — these are observations I made while reviewing each store. Weave them into the summary where relevant.");
  lines.push("");
  lines.push("Be direct. Use specifics from the recaps. Don't pad it.");

  return lines.join("\n");
}

// ── Week-parameterized queries ──────────────────────────────

export async function getStoreRecapsForWeekParam(storeIds: string[], weekEndingParam: string) {
  if (storeIds.length === 0) return [];

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
        eq(recap.weekEnding, weekEndingParam)
      )
    );

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

// ── All RMs' consolidated recaps (cross-region visibility) ──

export async function getAllConsolidatedRecaps(weekEndingParam: string) {
  const recaps = await db
    .select({
      consolidated: consolidatedRecap,
      rmName: rm.name,
      rmEmail: rm.email,
    })
    .from(consolidatedRecap)
    .innerJoin(rm, eq(rm.id, consolidatedRecap.rmId))
    .where(eq(consolidatedRecap.weekEnding, weekEndingParam))
    .orderBy(rm.name);

  return recaps.map((r) => ({
    ...r.consolidated,
    rmName: r.rmName,
    rmEmail: r.rmEmail,
  }));
}

// ── Store recap history (drill-down) ────────────────────────

export async function getStoreRecapHistory(storeId: string, limit = 8) {
  const recaps = await db
    .select({
      recap: recap,
      smName: sm.name,
      storeName: store.name,
    })
    .from(recap)
    .innerJoin(sm, eq(sm.id, recap.smId))
    .innerJoin(store, eq(store.id, recap.storeId))
    .where(eq(recap.storeId, storeId))
    .orderBy(desc(recap.weekEnding))
    .limit(limit);

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

// ── Available weeks ─────────────────────────────────────────

export async function getAvailableWeeks() {
  const weeks = await db
    .select({ weekEnding: recap.weekEnding })
    .from(recap)
    .groupBy(recap.weekEnding)
    .orderBy(desc(recap.weekEnding));

  return weeks.map((w) => w.weekEnding);
}

// ── RM private notes (for consolidation) ────────────────────

export async function saveRmNote(rmId: string, recapId: string, noteText: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") throw new Error("Unauthorized");

  const [created] = await db
    .insert(rmNote)
    .values({ rmId, recapId, noteText })
    .returning();
  return created;
}

export async function getRmNotesForRecap(recapId: string) {
  return db
    .select()
    .from(rmNote)
    .where(eq(rmNote.recapId, recapId))
    .orderBy(desc(rmNote.createdAt));
}

export async function getRmNotesForWeek(rmId: string, recapIds: string[]) {
  if (recapIds.length === 0) return [];
  return db
    .select({
      note: rmNote,
      storeName: store.name,
      smName: sm.name,
    })
    .from(rmNote)
    .innerJoin(recap, eq(recap.id, rmNote.recapId))
    .innerJoin(store, eq(store.id, recap.storeId))
    .innerJoin(sm, eq(sm.id, recap.smId))
    .where(
      and(
        eq(rmNote.rmId, rmId),
        sql`${rmNote.recapId} IN ${recapIds}`
      )
    )
    .orderBy(store.name, desc(rmNote.createdAt));
}

export async function deleteRmNote(noteId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") throw new Error("Unauthorized");
  await db.delete(rmNote).where(eq(rmNote.id, noteId));
}

// ── RM → SM notes (feedback visible to SM) ──────────────────

export async function saveRmSmNote(rmId: string, recapId: string, noteText: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "rm") throw new Error("Unauthorized");

  const [created] = await db
    .insert(rmSmNote)
    .values({ rmId, recapId, noteText })
    .returning();
  return created;
}

export async function getRmSmNotesForRecap(recapId: string) {
  return db
    .select()
    .from(rmSmNote)
    .where(eq(rmSmNote.recapId, recapId))
    .orderBy(desc(rmSmNote.createdAt));
}

export async function getSmFeedbackNotes(smId: string) {
  return db
    .select({
      note: rmSmNote,
      rmName: rm.name,
      weekEnding: recap.weekEnding,
    })
    .from(rmSmNote)
    .innerJoin(recap, eq(recap.id, rmSmNote.recapId))
    .innerJoin(rm, eq(rm.id, rmSmNote.rmId))
    .where(eq(recap.smId, smId))
    .orderBy(desc(rmSmNote.createdAt));
}
