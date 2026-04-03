import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

async function seedTemplates() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding templates and questions...");

  // Get the RM
  const [regionalManager] = await db
    .select()
    .from(schema.rm)
    .where(eq(schema.rm.email, "rm@recap.test"))
    .limit(1);

  if (!regionalManager) {
    console.error("RM not found. Run seed.ts first.");
    process.exit(1);
  }

  // Get the store and SM
  const [store1] = await db
    .select()
    .from(schema.store)
    .where(eq(schema.store.name, "Central Store"))
    .limit(1);

  const [storeManager] = await db
    .select()
    .from(schema.sm)
    .where(eq(schema.sm.email, "sm@recap.test"))
    .limit(1);

  // Create a standard template for the RM (applies to all stores)
  const [standardTemplate] = await db
    .insert(schema.recapTemplate)
    .values({
      templateType: "standard",
      name: "Weekly Store Recap",
      rmId: regionalManager.id,
      effectiveFrom: "2026-01-01",
      active: true,
    })
    .returning();
  console.log("Created standard template:", standardTemplate.name);

  // Add standard questions
  const standardQuestions = [
    {
      templateId: standardTemplate.id,
      questionText: "How did the overall week perform against targets? What drove the result?",
      questionType: "text" as const,
      sortOrder: 1,
      required: true,
    },
    {
      templateId: standardTemplate.id,
      questionText: "What metrics or areas outperformed expectations this week?",
      questionType: "text" as const,
      sortOrder: 2,
      required: true,
    },
    {
      templateId: standardTemplate.id,
      questionText: "Where are the biggest opportunities or underperforming areas? What's the plan?",
      questionType: "text" as const,
      sortOrder: 3,
      required: true,
    },
    {
      templateId: standardTemplate.id,
      questionText: "What is the team's focus moving forward this coming week?",
      questionType: "text" as const,
      sortOrder: 4,
      required: true,
    },
  ];

  await db.insert(schema.recapQuestion).values(standardQuestions);
  console.log(`Created ${standardQuestions.length} standard questions`);

  // Create a store-specific template with extra follow-up questions
  const [storeTemplate] = await db
    .insert(schema.recapTemplate)
    .values({
      templateType: "store_specific",
      name: "Central Store — Focus Areas",
      rmId: regionalManager.id,
      storeId: store1.id,
      effectiveFrom: "2026-01-01",
      active: true,
    })
    .returning();
  console.log("Created store-specific template:", storeTemplate.name);

  const storeQuestions = [
    {
      templateId: storeTemplate.id,
      questionText: "How is the new product launch tracking in your store? Any customer feedback?",
      questionType: "text" as const,
      sortOrder: 1,
      required: true,
    },
    {
      templateId: storeTemplate.id,
      questionText: "How is team morale and development progressing? Any callouts?",
      questionType: "text" as const,
      sortOrder: 2,
      required: false,
    },
  ];

  await db.insert(schema.recapQuestion).values(storeQuestions);
  console.log(`Created ${storeQuestions.length} store-specific questions`);

  // Add a prompt rule (theme/direction)
  await db.insert(schema.promptRule).values({
    rmId: regionalManager.id,
    ruleType: "theme",
    value: "Focus on conversion rate improvement and guest experience this quarter.",
    active: true,
  });
  console.log("Created prompt rule (theme)");

  // Seed some past recaps to test history and pattern detection
  const pastWeeks = ["2026-03-15", "2026-03-22", "2026-03-29"];

  for (const weekEnding of pastWeeks) {
    const [pastRecap] = await db
      .insert(schema.recap)
      .values({
        weekEnding,
        status: "submitted",
        smId: storeManager.id,
        storeId: store1.id,
      })
      .returning();

    // Get all questions
    const allQuestions = [...standardQuestions, ...storeQuestions];
    const dbQuestions = await db.select().from(schema.recapQuestion);

    // Create answers — deliberately repeat "team fatigue" theme
    const answers = dbQuestions.map((q, i) => {
      let answerText = `Sample answer for week ending ${weekEnding}, question ${i + 1}.`;

      // Make recurring theme for pattern detection testing
      if (q.questionText.includes("morale") || q.questionText.includes("team")) {
        answerText =
          "The team has been really tired this week. Long hours and back-to-back shifts are wearing people down. Morale is lower than usual.";
      }
      if (q.questionText.includes("opportunities") || q.questionText.includes("underperforming")) {
        answerText =
          "Conversion rate is still below target. We're seeing good traffic but struggling to close. Team fatigue might be contributing to lower energy on the floor.";
      }

      return {
        recapId: pastRecap.id,
        questionId: q.id,
        answerText,
      };
    });

    await db.insert(schema.recapAnswer).values(answers);
    console.log(`Created recap + answers for week ending ${weekEnding}`);
  }

  console.log("\nTemplate seed complete!");
}

seedTemplates().catch(console.error);
