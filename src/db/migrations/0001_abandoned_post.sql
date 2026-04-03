CREATE TABLE "rm_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rm_id" uuid NOT NULL,
	"recap_id" uuid NOT NULL,
	"note_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rm_sm_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rm_id" uuid NOT NULL,
	"recap_id" uuid NOT NULL,
	"note_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rm_note" ADD CONSTRAINT "rm_note_rm_id_rm_id_fk" FOREIGN KEY ("rm_id") REFERENCES "public"."rm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rm_note" ADD CONSTRAINT "rm_note_recap_id_recap_id_fk" FOREIGN KEY ("recap_id") REFERENCES "public"."recap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rm_sm_note" ADD CONSTRAINT "rm_sm_note_rm_id_rm_id_fk" FOREIGN KEY ("rm_id") REFERENCES "public"."rm"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rm_sm_note" ADD CONSTRAINT "rm_sm_note_recap_id_recap_id_fk" FOREIGN KEY ("recap_id") REFERENCES "public"."recap"("id") ON DELETE cascade ON UPDATE no action;