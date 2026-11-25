import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * "Esqueci a senha" (rodada 47). O link enviado por e-mail leva um token
 * assinado (HMAC com o SESSION_SECRET), sem precisar de tabela nova no banco:
 *
 *   token = base64url({ uid, exp, fp }) + "." + assinatura
 *
 * - `exp`: validade de 60 minutos.
 * - `fp`: "impressão digital" do hash da senha atual. Quando a senha é
 *   trocada (por este link ou por qualquer outro meio), o `fp` deixa de
 *   bater e o link vira inútil — ou seja, cada link só funciona uma vez.
 */

const TTL_MS = 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não configurado.");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(`pwreset:${payload}`).digest("base64url");
}

function fingerprint(passwordHash: string): string {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 24);
}

export function createResetToken(user: { id: string; passwordHash: string }): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: user.id, exp: Date.now() + TTL_MS, fp: fingerprint(user.passwordHash) })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Devolve o usuário se o token for válido (assinatura, validade, senha ainda
 * a mesma, conta ativa e não excluída); senão, null. */
export async function userForResetToken(token: string | null | undefined) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let data: { uid?: string; exp?: number; fp?: string };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!data.uid || !data.exp || !data.fp || Date.now() > data.exp) return null;

  const [user] = await db.select().from(users).where(eq(users.id, data.uid));
  if (!user || !user.active || user.deletedAt) return null;
  if (fingerprint(user.passwordHash) !== data.fp) return null;
  return user;
}
