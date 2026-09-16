"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireUser();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Preencha todos os campos." };
  }
  if (newPassword.length < 6) {
    return { error: "A nova senha precisa ter pelo menos 6 caracteres." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "A confirmação não é igual à nova senha." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId!));
  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    await logAudit(user.id, "PASSWORD_CHANGE_FAILED", { reason: "wrong_current_password" });
    return { error: "Senha atual incorreta." };
  }

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));

  await logAudit(user.id, "PASSWORD_CHANGED", {});

  return { success: true };
}
