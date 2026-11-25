"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { userForResetToken } from "@/lib/password-reset";

export interface ResetWithTokenState {
  error?: string;
  success?: boolean;
}

export async function resetPasswordWithTokenAction(
  _prev: ResetWithTokenState,
  formData: FormData
): Promise<ResetWithTokenState> {
  const token = String(formData.get("token") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) {
    return { error: "A nova senha precisa ter pelo menos 6 caracteres." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "A confirmação não é igual à nova senha." };
  }

  const user = await userForResetToken(token);
  if (!user) {
    return { error: "Este link expirou ou já foi usado. Peça um novo em “Esqueci minha senha”." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  await logAudit(user.id, "PASSWORD_RESET_COMPLETED", {});

  return { success: true };
}
