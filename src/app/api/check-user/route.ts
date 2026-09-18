/**
 * Rota de diagnóstico (protegida pelo mesmo SETUP_TOKEN) para checar o
 * estado de uma conta sem precisar logar como ela — usada quando alguém
 * relata que um login não está funcionando. Não expõe a senha (nem o hash):
 * só confirma se a conta existe, está ativa, e com quais dados exatos ela
 * foi cadastrada (login/e-mail, papel, filial, cadastro completo).
 *
 * Uso:
 *   https://SEU-APP.vercel.app/api/check-user
 *     ?token=SEU_TOKEN
 *     &email=adriano.lima
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

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

  const rawEmail = req.nextUrl.searchParams.get("email");
  if (!rawEmail) {
    return NextResponse.json({ ok: false, error: "Parâmetro obrigatório: email (ou login)." }, { status: 400 });
  }

  // Mesma normalização usada no login de verdade (src/lib/auth.ts) — se o
  // valor cadastrado tiver espaço/maiúscula sobrando, isso já apareceria
  // aqui como "não encontrado" mesmo existindo uma linha parecida.
  const normalizedEmail = rawEmail.trim().toLowerCase();

  const [exactMatch] = await db.select().from(users).where(eq(users.email, normalizedEmail));

  // Também lista qualquer conta cujo e-mail/login pareça com o que foi
  // pedido, pra revelar erros de digitação (espaço, acento, letra trocada)
  // que fariam a busca exata falhar silenciosamente.
  const allUsers = await db.select().from(users);
  const similar = allUsers
    .filter((u) => u.email.toLowerCase().includes(normalizedEmail) || normalizedEmail.includes(u.email.toLowerCase()))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      profileCompleted: u.profileCompleted,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      hasPasswordHash: Boolean(u.passwordHash && u.passwordHash.length > 0),
    }));

  return NextResponse.json({
    ok: true,
    searchedFor: normalizedEmail,
    exactMatch: exactMatch
      ? {
          id: exactMatch.id,
          name: exactMatch.name,
          email: exactMatch.email,
          role: exactMatch.role,
          active: exactMatch.active,
          profileCompleted: exactMatch.profileCompleted,
          createdAt: exactMatch.createdAt,
          lastLoginAt: exactMatch.lastLoginAt,
          hasPasswordHash: Boolean(exactMatch.passwordHash && exactMatch.passwordHash.length > 0),
        }
      : null,
    similarAccounts: similar,
  });
}
