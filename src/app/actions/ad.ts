"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  ad,
  rm,
  consolidatedRecap,
  adNote,
  recap,
  recapAnswer,
  recapQuestion,
  recapLineItem,
  store,
  sm,
  adRecap,
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

export async function getAdContext() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ad") {
    throw new Error("Unauthorized");
  }
  const entityId = (session.user as any).entityId;

  const [adRecord] = await db
    .select()
    .from(ad)
    .where(eq(ad.id, entityId))
    .limit(1);

  if (!adRecord) throw new Error("AD not found");
  return adRecord;
}

export async function getAdRms(adId: string) {
  return db.select().from(rm).where(eq(rm.adId, adId));
}

export async function getRmConsolidatedRecaps(rmIds: string[]) {
  if (rmIds.length === 0) return [];
  const weekEnding = getCurrentWeekEnding();

  const recaps = await db
    .select({
      consolidated: consolidatedRecap,
      rmName: rm.name,
    })
    .from(consolidatedRecap)
    .innerJoin(rm, eq(rm.id, consolidatedRecap.rmId))
    .where(
      and(
        sql`${consolidatedRecap.rmId} IN ${rmIds}`,
        eq(consolidatedRecap.weekEnding, weekEnding)
      )
    );

  // For each consolidated recap, get linked store recaps
  const result = [];
  for (const r of recaps) {
    const lineItems = await db
      .select({
        recap: recap,
        smName: sm.name,
        storeName: store.name,
      })
      .from(recapLineItem)
      .innerJoin(recap, eq(recap.id, recapLineItem.recapId))
      .innerJoin(sm, eq(sm.id, recap.smId))
      .innerJoin(store, eq(store.id, recap.storeId))
      .where(eq(recapLineItem.consolidatedRecapId, r.consolidated.id));

    // Get notes
    const notes = await db
      .select()
      .from(adNote)
      .where(eq(adNote.consolidatedRecapId, r.consolidated.id))
      .orderBy(desc(adNote.createdAt));

    result.push({
      ...r.consolidated,
      rmName: r.rmName,
      storeRecaps: lineItems.map((li) => ({
        storeName: li.storeName,
        smName: li.smName,
        status: li.recap.status,
      })),
      notes,
    });
  }

  return result;
}

export async function saveAdNote(
  adId: string,
  consolidatedRecapId: string,
  noteText: string
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ad") {
    throw new Error("Unauthorized");
  }

  const [created] = await db
    .insert(adNote)
    .values({ adId, consolidatedRecapId, noteText })
    .returning();

  return created;
}

export async function generateAdPrompt(adId: string) {
  const rms = await getAdRms(adId);
  const rmIds = rms.map((r) => r.id);
  const consolidated = await getRmConsolidatedRecaps(rmIds);
  const weekEnding = getCurrentWeekEnding();

  const lines: string[] = [];
  lines.push(
    `You are a business writing assistant helping an area director prepare a 5-minute market overview for the week ending ${weekEnding}. This market has ${rms.length} regional managers.`
  );
  lines.push("");

  if (consolidated.length === 0) {
    lines.push("No RM consolidated recaps have been submitted yet for this week. Let me know when they're in.");
    return lines.join("\n");
  }

  lines.push(
    `I have ${consolidated.length} regional manager recap(s) below. Help me distill these into talking points I can present in 5 minutes. I need the big picture — what's the story of my market this week?`
  );
  lines.push("");

  for (const c of consolidated) {
    lines.push(`--- ${c.rmName} [${c.status}] ---`);
    lines.push(c.summary || "(No summary yet)");
    if (c.storeRecaps.length > 0) {
      lines.push(
        `Stores covered: ${c.storeRecaps.map((s) => s.storeName).join(", ")}`
      );
    }
    lines.push("");
  }

  lines.push("Give me a 5-minute market overview structured as:");
  lines.push("1. The headline — how did the market perform overall?");
  lines.push("2. Wins — what should I celebrate or highlight?");
  lines.push("3. Concerns — what's trending across regions that needs attention?");
  lines.push("4. Strategic focus — what should we be driving next week?");
  lines.push("5. RM callouts — any specific follow-ups I need to have?");
  lines.push("");
  lines.push("Write it as talking points I can speak from, not a report I'd read. Keep it tight.");

  return lines.join("\n");
}

// ── AD Market Recap persistence ─────────────────────────────

export async function getAdRecap(adId: string) {
  const weekEnding = getCurrentWeekEnding();
  const [existing] = await db
    .select()
    .from(adRecap)
    .where(and(eq(adRecap.adId, adId), eq(adRecap.weekEnding, weekEnding)))
    .limit(1);
  return existing ?? null;
}

export async function saveAdRecap(adId: string, summary: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ad") throw new Error("Unauthorized");

  const weekEnding = getCurrentWeekEnding();

  const [existing] = await db
    .select()
    .from(adRecap)
    .where(and(eq(adRecap.adId, adId), eq(adRecap.weekEnding, weekEnding)))
    .limit(1);

  if (existing) {
    await db
      .update(adRecap)
      .set({ summary, updatedAt: new Date() })
      .where(eq(adRecap.id, existing.id));
    return existing;
  }

  const [created] = await db
    .insert(adRecap)
    .values({ adId, weekEnding, summary })
    .returning();
  return created;
}
