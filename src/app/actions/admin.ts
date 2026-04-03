"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { store, sm, region, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashSync } from "bcryptjs";

export async function getStoresForRegion(regionId: string) {
  return db.select().from(store).where(eq(store.regionId, regionId));
}

export async function getSmsForStores(storeIds: string[]) {
  if (storeIds.length === 0) return [];
  return db
    .select({ sm: sm, storeName: store.name })
    .from(sm)
    .innerJoin(store, eq(store.id, sm.storeId))
    .where(sql`${sm.storeId} IN ${storeIds}`);
}

export async function createStore(data: {
  name: string;
  address: string;
  regionId: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [created] = await db.insert(store).values(data).returning();
  return created;
}

export async function createSm(data: {
  name: string;
  email: string;
  storeId: string;
  password: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [created] = await db
    .insert(sm)
    .values({ name: data.name, email: data.email, storeId: data.storeId })
    .returning();

  // Create user account
  await db.insert(user).values({
    email: data.email,
    passwordHash: hashSync(data.password, 10),
    role: "sm",
    entityId: created.id,
  });

  return created;
}

export async function getRegion(regionId: string) {
  const [r] = await db
    .select()
    .from(region)
    .where(eq(region.id, regionId))
    .limit(1);
  return r;
}
