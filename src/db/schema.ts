import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["sm", "rm", "ad"]);
export const recapStatusEnum = pgEnum("recap_status", [
  "draft",
  "submitted",
  "reviewed",
]);
export const questionTypeEnum = pgEnum("question_type", [
  "text",
  "number",
  "scale",
]);

// ── Org hierarchy ──────────────────────────────────────────────

export const region = pgTable("region", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ad = pgTable("ad", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  regionId: uuid("region_id")
    .references(() => region.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rm = pgTable("rm", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  adId: uuid("ad_id")
    .references(() => ad.id)
    .notNull(),
  regionId: uuid("region_id")
    .references(() => region.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const store = pgTable("store", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  regionId: uuid("region_id")
    .references(() => region.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sm = pgTable("sm", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  storeId: uuid("store_id")
    .references(() => store.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Auth ───────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  entityId: uuid("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── History tracking ───────────────────────────────────────────

export const storeRegionHistory = pgTable("store_region_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .references(() => store.id)
    .notNull(),
  regionId: uuid("region_id")
    .references(() => region.id)
    .notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
});

export const smStoreHistory = pgTable("sm_store_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  smId: uuid("sm_id")
    .references(() => sm.id)
    .notNull(),
  storeId: uuid("store_id")
    .references(() => store.id)
    .notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
});

// ── Templates & questions ──────────────────────────────────────

export const recapTemplate = pgTable("recap_template", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateType: varchar("template_type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  rmId: uuid("rm_id").references(() => rm.id),
  storeId: uuid("store_id").references(() => store.id),
  smId: uuid("sm_id").references(() => sm.id),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recapQuestion = pgTable("recap_question", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .references(() => recapTemplate.id, { onDelete: "cascade" })
    .notNull(),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").default("text").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  required: boolean("required").default(true).notNull(),
});

export const promptRule = pgTable("prompt_rule", {
  id: uuid("id").defaultRandom().primaryKey(),
  rmId: uuid("rm_id")
    .references(() => rm.id)
    .notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(),
  value: text("value").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Recaps ─────────────────────────────────────────────────────

export const recap = pgTable("recap", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekEnding: date("week_ending").notNull(),
  status: recapStatusEnum("status").default("draft").notNull(),
  smId: uuid("sm_id")
    .references(() => sm.id)
    .notNull(),
  storeId: uuid("store_id")
    .references(() => store.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recapAnswer = pgTable("recap_answer", {
  id: uuid("id").defaultRandom().primaryKey(),
  recapId: uuid("recap_id")
    .references(() => recap.id, { onDelete: "cascade" })
    .notNull(),
  questionId: uuid("question_id")
    .references(() => recapQuestion.id)
    .notNull(),
  answerText: text("answer_text"),
  answerValue: integer("answer_value"),
});

export const consolidatedRecap = pgTable("consolidated_recap", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekEnding: date("week_ending").notNull(),
  summary: text("summary"),
  status: recapStatusEnum("status").default("draft").notNull(),
  rmId: uuid("rm_id")
    .references(() => rm.id)
    .notNull(),
  adId: uuid("ad_id").references(() => ad.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recapLineItem = pgTable("recap_line_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  consolidatedRecapId: uuid("consolidated_recap_id")
    .references(() => consolidatedRecap.id, { onDelete: "cascade" })
    .notNull(),
  recapId: uuid("recap_id")
    .references(() => recap.id)
    .notNull(),
});

// ── AD Notes ───────────────────────────────────────────────────

export const adNote = pgTable("ad_note", {
  id: uuid("id").defaultRandom().primaryKey(),
  adId: uuid("ad_id")
    .references(() => ad.id)
    .notNull(),
  consolidatedRecapId: uuid("consolidated_recap_id")
    .references(() => consolidatedRecap.id, { onDelete: "cascade" })
    .notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── RM Notes (private, for consolidation) ──────────────────────

export const rmNote = pgTable("rm_note", {
  id: uuid("id").defaultRandom().primaryKey(),
  rmId: uuid("rm_id")
    .references(() => rm.id)
    .notNull(),
  recapId: uuid("recap_id")
    .references(() => recap.id, { onDelete: "cascade" })
    .notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── RM → SM Notes (feedback visible to SM) ─────────────────────

export const rmSmNote = pgTable("rm_sm_note", {
  id: uuid("id").defaultRandom().primaryKey(),
  rmId: uuid("rm_id")
    .references(() => rm.id)
    .notNull(),
  recapId: uuid("recap_id")
    .references(() => recap.id, { onDelete: "cascade" })
    .notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
