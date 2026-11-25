"use server";

import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { createResetToken } from "@/lib/password-reset";

export interface ForgotPasswordState {
  error?: string;
  success?: boolean;
}

const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60 * 1000;

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const login = String(formData.get("login") || "").trim().toLowerCase();
  if (!login) return { error: "Informe o e-mail que você usa para entrar." };

  const [user] = await db.select().from(users).where(eq(users.email, login));

  // A resposta é sempre a mesma (exista a conta ou não), para ninguém
  // descobrir quais e-mails têm cadastro.
  if (user && user.active && !user.deletedAt && user.email.includes("@")) {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const recent = await db
      .select({ id: auditLogs.id })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, user.id),
          eq(auditLogs.action, "PASSWORD_RESET_REQUESTED"),
          gt(auditLogs.createdAt, since)
        )
      );

    if (recent.length < MAX_REQUESTS_PER_WINDOW) {
      const base = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
      const link = `${base}/redefinir-senha?token=${createResetToken(user)}`;
      await logAudit(user.id, "PASSWORD_RESET_REQUESTED", {});
      await sendNotification({
        toEmail: user.email,
        subject: "Redefinição de senha — BMC Academy",
        body: `Olá, ${user.name}!

Recebemos um pedido para redefinir a senha da sua conta na BMC Academy.

Para criar uma nova senha, abra o link abaixo (vale por 1 hora e só pode ser usado uma vez):
${link}

Se não foi você quem pediu, é só ignorar este e-mail — a sua senha continua a mesma.

— BMC Academy`,
        relatedUserId: user.id,
      });
    }
  }

  return { success: true };
}
