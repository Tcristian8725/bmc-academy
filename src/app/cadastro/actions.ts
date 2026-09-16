"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireLoggedIn } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export interface CompleteProfileState {
  error?: string;
  success?: boolean;
}

// Mapa do tipo escolhido pela pessoa para o papel de acesso no sistema.
// "Funcionário BMC" é mantido no mesmo nível de Técnico por segurança: o
// autocadastro é público e sem aprovação de um admin, então nunca deve
// conceder por conta própria acesso de Gestor/Administrador — isso é
// definido depois, manualmente, em Admin > Usuários.
const TIPO_TO_ROLE = {
  TECNICO: "TECNICO",
  RC: "RC",
  FUNCIONARIO_BMC: "TECNICO",
} as const;

const TIPO_TO_POSITION_LABEL = {
  TECNICO: "Técnico (autocadastro)",
  RC: "Representante Comercial (autocadastro)",
  FUNCIONARIO_BMC: "Funcionário BMC (autocadastro)",
} as const;

export async function completeProfileAction(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const session = await requireLoggedIn();

  const name = String(formData.get("name") || "").trim();
  const cpf = String(formData.get("cpf") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const tipo = String(formData.get("tipo") || "") as keyof typeof TIPO_TO_ROLE;

  if (!name) {
    return { error: "Informe seu nome completo." };
  }
  if (!cpf) {
    return { error: "Informe seu CPF." };
  }
  if (!address) {
    return { error: "Informe seu endereço." };
  }
  if (!TIPO_TO_ROLE[tipo]) {
    return { error: "Selecione seu tipo de vínculo." };
  }

  const role = TIPO_TO_ROLE[tipo];

  await db
    .update(users)
    .set({
      name,
      cpf,
      cnpj: cnpj || null,
      address,
      position: TIPO_TO_POSITION_LABEL[tipo],
      role,
      profileCompleted: true,
    })
    .where(eq(users.id, session.userId!));

  await logAudit(session.userId!, "PROFILE_COMPLETED", { tipo, role });

  const updatedSession = await getSession();
  updatedSession.name = name;
  updatedSession.role = role;
  updatedSession.profileCompleted = true;
  await updatedSession.save();

  return { success: true };
}
