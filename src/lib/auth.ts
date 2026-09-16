import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, type UserRole } from "./session";
import { logAudit } from "./audit";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

  if (!user || !user.active) {
    await logAudit(null, "LOGIN_FAILED", { email: normalizedEmail, reason: "not_found_or_inactive" });
    return { ok: false, error: "E-mail ou senha inválidos." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await logAudit(user.id, "LOGIN_FAILED", { email: normalizedEmail, reason: "wrong_password" });
    return { ok: false, error: "E-mail ou senha inválidos." };
  }

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.email = user.email;
  session.role = user.role as UserRole;
  await session.save();

  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, user.id));

  await logAudit(user.id, "LOGIN", { email: normalizedEmail });

  return { ok: true };
}

export async function logout() {
  const session = await getSession();
  const userId = session.userId;
  session.destroy();
  if (userId) {
    await logAudit(userId, "LOGOUT", {});
  }
}

/** Usa em Server Components de páginas protegidas. Redireciona se não autenticado
 *  ou se o papel do usuário não estiver na lista de papéis permitidos. */
export async function requireUser(allowedRoles?: UserRole[]) {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }
  if (allowedRoles && !allowedRoles.includes(session.role as UserRole)) {
    redirect("/painel");
  }
  return session as Required<Pick<typeof session, "userId" | "name" | "email" | "role">> &
    typeof session;
}
