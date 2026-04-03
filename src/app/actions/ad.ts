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
  lines.push("Market Overview Recap");
  lines.push(`Week ending: ${weekEnding}`);
  lines.push(`RMs: ${rms.length} | Total stores in market: estimated 25-30`);
  lines.push("");

  if (consolidated.length === 0) {
    lines.push("No RM consolidated recaps submitted yet for this week.");
    return lines.join("\n");
  }

  lines.push(
    "Below are the consolidated recaps from your Regional Managers. Distill into a 5-minute market overview."
  );
  lines.push("");

  for (const c of consolidated) {
    lines.push(`--- ${c.rmName} [${c.status}] ---`);
    lines.push(c.summary || "(No summary yet)");
    if (c.storeRecaps.length > 0) {
      lines.push(
        `Stores included: ${c.storeRecaps.map((s) => s.storeName).join(", ")}`
      );
    }
    lines.push("");
  }

  lines.push("Produce a 5-minute market overview covering:");
  lines.push("1. Overall market performance and trend");
  lines.push("2. Regional highlights and wins");
  lines.push("3. Concerns or issues trending across the market");
  lines.push("4. Strategic focus areas for next week");
  lines.push("5. Any RM-specific callouts or follow-ups");

  return lines.join("\n");
}
