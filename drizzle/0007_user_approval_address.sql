ALTER TABLE "users" ADD COLUMN "cep" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approval_status" text DEFAULT 'APROVADO' NOT NULL;
