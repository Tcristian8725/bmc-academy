import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type UserRole = "ADMIN" | "GESTOR" | "TECNICO" | "RC";

export interface SessionData {
  userId?: string;
  name?: string;
  email?: string;
  role?: UserRole;
}

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  // Protótipo: gera um aviso claro em vez de deixar quebrar silenciosamente.
  // Em produção, SESSION_SECRET deve vir de variável de ambiente segura.
  console.warn(
    "[BMC Academy] SESSION_SECRET ausente ou curto — defina uma string de 32+ caracteres em .env.local"
  );
}

export const sessionOptions: SessionOptions = {
  password: secret || "dev-only-insecure-secret-please-change-32chars!",
  cookieName: "bmc_academy_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
