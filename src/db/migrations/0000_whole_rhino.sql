CREATE TYPE "public"."question_type" AS ENUM('text', 'number', 'scale');--> statement-breakpoint
CREATE TYPE "public"."recap_status" AS ENUM('draft', 'submitted', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('sm', 'rm', 'ad');--> statement-breakpoint
CREATE TABLE "ad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"region_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ad_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"consolidated_recap_id" uuid NOT NULL,
	"note_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consolidated_recap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_ending" date NOT NULL,
	"summary" text,
	"status" "recap_status" DEFAULT 'draft' NOT NULL,
	"rm_id" uuid NOT NULL,
	"ad_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rm_id" uuid NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"value" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_ending" date NOT NULL,
	"status" "recap_status" DEFAULT 'draft' NOT NULL,
	"sm_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recap_answer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recap_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text,
	"answer_value" integer
);
--> statement-breakpoint
CREATE TABLE "recap_line_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consolidated_recap_id" uuid NOT NULL,
	"recap_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recap_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "question_type" DEFAULT 'text' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recap_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"rm_id" uuid,
	"store_id" uuid,
	"sm_id" uuid,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ad_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rm_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sm_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sm_store_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sm_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE "store" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"region_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_region_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ad" ADD CONSTRAINT "ad_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_note" ADD CONSTRAINT "ad_note_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_note" ADD CONSTRAINT "ad_note_consolidated_recap_id_consolidated_recap_id_fk" FOREIGN KEY ("consolidated_recap_id") REFERENCES "public"."consolidated_recap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidated_recap" ADD CONSTRAINT "consolidated_recap_rm_id_rm_id_fk" FOREIGN KEY ("rm_id") REFERENCES "public"."rm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidated_recap" ADD CONSTRAINT "consolidated_recap_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_rule" ADD CONSTRAINT "prompt_rule_rm_id_rm_id_fk" FOREIGN KEY ("rm_id") REFERENCES "public"."rm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap" ADD CONSTRAINT "recap_sm_id_sm_id_fk" FOREIGN KEY ("sm_id") REFERENCES "public"."sm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap" ADD CONSTRAINT "recap_store_id_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_answer" ADD CONSTRAINT "recap_answer_recap_id_recap_id_fk" FOREIGN KEY ("recap_id") REFERENCES "public"."recap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_answer" ADD CONSTRAINT "recap_answer_question_id_recap_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."recap_question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_line_item" ADD CONSTRAINT "recap_line_item_consolidated_recap_id_consolidated_recap_id_fk" FOREIGN KEY ("consolidated_recap_id") REFERENCES "public"."consolidated_recap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_line_item" ADD CONSTRAINT "recap_line_item_recap_id_recap_id_fk" FOREIGN KEY ("recap_id") REFERENCES "public"."recap"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_question" ADD CONSTRAINT "recap_question_template_id_recap_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."recap_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_template" ADD CONSTRAINT "recap_template_rm_id_rm_id_fk" FOREIGN KEY ("rm_id") REFERENCES "public"."rm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_template" ADD CONSTRAINT "recap_template_store_id_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recap_template" ADD CONSTRAINT "recap_template_sm_id_sm_id_fk" FOREIGN KEY ("sm_id") REFERENCES "public"."sm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rm" ADD CONSTRAINT "rm_ad_id_ad_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rm" ADD CONSTRAINT "rm_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sm" ADD CONSTRAINT "sm_store_id_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sm_store_history" ADD CONSTRAINT "sm_store_history_sm_id_sm_id_fk" FOREIGN KEY ("sm_id") REFERENCES "public"."sm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sm_store_history" ADD CONSTRAINT "sm_store_history_store_id_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store" ADD CONSTRAINT "store_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_region_history" ADD CONSTRAINT "store_region_history_store_id_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_region_history" ADD CONSTRAINT "store_region_history_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;