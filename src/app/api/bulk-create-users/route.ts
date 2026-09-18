/**
 * Rota de manutenção (protegida pelo mesmo SETUP_TOKEN) para criar em lote
 * as contas listadas em src/data/pending-technicians.ts — mesma lógica de
 * Admin > Usuários > "+ Novo usuário" (hash de senha, atribuição automática
 * dos treinamentos publicados do perfil), só que sem precisar preencher o
 * formulário um por um. Idempotente: quem já existe (mesmo login) é pulado,
 * nunca sobrescreve senha de conta já em uso.
 *
 * Uso: abrir no navegador (uma vez por lista nova):
 *   https://SEU-APP.vercel.app/api/bulk-create-users?token=SEU_TOKEN
 *
 * Fluxo pra listas novas: eu atualizo src/data/pending-technicians.ts com
 * as pessoas novas e publico — essa rota volta a rodar do zero, mas só cria
 * quem ainda não existe (quem já foi criado antes é ignorado).
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { assignPublishedTrainingsToUser } from "@/lib/assignments";
import { logAudit } from "@/lib/audit";
import { PENDING_TECHNICIANS } from "@/data/pending-technicians";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SETUP_TOKEN não configurado nas variáveis de ambiente do Vercel." },
      { status: 500 }
    );
  }
  if (token !== expected) {
    return NextResponse.json({ ok: false, error: "Token inválido." }, { status: 401 });
  }

  const created: { name: string; login: string; tempPassword: string; role: string }[] = [];
  const skipped: { name: string; login: string; reason: string }[] = [];

  for (const person of PENDING_TECHNICIANS) {
    const normalizedLogin = person.login.trim().toLowerCase();

    if (!person.name || !normalizedLogin || !person.tempPassword) {
      skipped.push({ name: person.name, login: normalizedLogin, reason: "dados incompletos" });
      continue;
    }
    if (person.tempPassword.length < 6) {
      skipped.push({ name: person.name, login: normalizedLogin, reason: "senha provisória com menos de 6 caracteres" });
      continue;
    }

    const [existing] = await db.select().from(users).where(eq(users.email, normalizedLogin));
    if (existing) {
      skipped.push({ name: person.name, login: normalizedLogin, reason: "já existe uma conta com este login" });
      continue;
    }

    const passwordHash = await hashPassword(person.tempPassword);

    const [createdUser] = await db
      .insert(users)
      .values({
        name: person.name,
        email: normalizedLogin,
        passwordHash,
        role: person.role,
        position: person.position ?? null,
      })
      .returning();

    await logAudit(createdUser.id, "USER_CREATED", { email: normalizedLogin, role: person.role, via: "bulk-create-users" });

    // Mesmo comportamento do cadastro manual (rodada 14): já libera todos os
    // treinamentos publicados do perfil, sem precisar de atribuição manual.
    await assignPublishedTrainingsToUser(createdUser.id, person.role);

    created.push({
      name: person.name,
      login: normalizedLogin,
      tempPassword: person.tempPassword,
      role: person.role,
    });
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
    skipped,
  });
}
