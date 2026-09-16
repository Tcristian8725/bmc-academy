"use server";

import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";

export interface RequestAccessState {
  error?: string;
  success?: boolean;
}

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url"); // ~12 caracteres
}

export async function requestAccessAction(
  _prevState: RequestAccessState,
  formData: FormData
): Promise<RequestAccessState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return {
      error: "Já existe uma conta com este e-mail. Se você já tem conta, faça login normalmente.",
    };
  }

  const tempPassword = generateTempPassword();

  // Manda o e-mail ANTES de criar a conta: se o envio falhar (ex.: provedor
  // de e-mail ainda não configurado), não sobra uma conta "perdida" no banco
  // com uma senha que ninguém mais consegue recuperar.
  const result = await sendNotification({
    toEmail: email,
    subject: "Seu acesso à BMC Academy",
    body: `Olá!

Sua conta na BMC Academy foi criada. Use os dados abaixo para o primeiro acesso:

E-mail: ${email}
Senha provisória: ${tempPassword}

No primeiro acesso, você vai precisar completar seu cadastro (nome, CPF, CNPJ quando aplicável, endereço e tipo de vínculo).

Acesse: ${process.env.APP_BASE_URL || ""}/login

— BMC Academy`,
  });

  if (!result.ok) {
    return {
      error:
        "Não conseguimos enviar o e-mail de acesso agora (o envio automático ainda está sendo configurado). Peça ao administrador para criar seu acesso manualmente.",
    };
  }

  const passwordHash = await hashPassword(tempPassword);

  const [user] = await db
    .insert(users)
    .values({
      // Nome provisório — a pessoa preenche o nome real na tela de cadastro
      // no primeiro acesso. Não é um dado inventado, é um placeholder visível
      // só até ela completar o próprio cadastro.
      name: email,
      email,
      passwordHash,
      role: "TECNICO", // provisório: o papel final é definido no cadastro (limitado por segurança — ver actions.ts de /cadastro)
      profileCompleted: false,
    })
    .returning();

  await logAudit(user.id, "ACCESS_REQUESTED", { email });

  return { success: true };
}
