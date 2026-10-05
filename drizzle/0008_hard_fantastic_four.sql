ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
-- O perfil "Gestor" deixou de existir (rodada 42): contas que ainda tinham esse perfil são arquivadas (histórico preservado, sem acesso).
UPDATE "users" SET "deleted_at" = now(), "active" = false WHERE "role" = 'GESTOR';
