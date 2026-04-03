import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Create region
  const [hkRegion] = await db
    .insert(schema.region)
    .values({ name: "Hong Kong", country: "HK" })
    .returning();
  console.log("Created region:", hkRegion.name);

  // Create AD
  const [areaDirector] = await db
    .insert(schema.ad)
    .values({ name: "Sarah Chen", email: "ad@recap.test", regionId: hkRegion.id })
    .returning();
  console.log("Created AD:", areaDirector.name);

  // Create RM
  const [regionalManager] = await db
    .insert(schema.rm)
    .values({
      name: "James Wong",
      email: "rm@recap.test",
      adId: areaDirector.id,
      regionId: hkRegion.id,
    })
    .returning();
  console.log("Created RM:", regionalManager.name);

  // Create Store
  const [store1] = await db
    .insert(schema.store)
    .values({
      name: "Central Store",
      address: "1 Queen's Road Central, Hong Kong",
      regionId: hkRegion.id,
    })
    .returning();
  console.log("Created store:", store1.name);

  // Create SM
  const [storeManager] = await db
    .insert(schema.sm)
    .values({ name: "Amy Liu", email: "sm@recap.test", storeId: store1.id })
    .returning();
  console.log("Created SM:", storeManager.name);

  // Create users (password: "password" for all)
  const passwordHash = hashSync("password", 10);

  await db.insert(schema.user).values([
    { email: "ad@recap.test", passwordHash, role: "ad", entityId: areaDirector.id },
    { email: "rm@recap.test", passwordHash, role: "rm", entityId: regionalManager.id },
    { email: "sm@recap.test", passwordHash, role: "sm", entityId: storeManager.id },
  ]);
  console.log("Created users: ad@recap.test, rm@recap.test, sm@recap.test (password: password)");

  console.log("\nSeed complete!");
}

seed().catch(console.error);
