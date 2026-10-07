"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireLoggedIn } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { assignPublishedTrainingsToUser } from "@/lib/assignments";
import { notifyAdminsPendingSignup } from "@/lib/approval";
import { normalizeUf } from "@/lib/regions";
import { formatPhone, isValidCnpj, isValidCpf, isValidPhone, onlyDigits } from "@/lib/documents";

export interface CompleteProfileState {
  error?: string;
  success?: boolean;
}

// Mapa do tipo escolhido pela pessoa para o papel de acesso no sistema.
// Os três tipos (Técnico, RC, Funcionário BMC) viram papéis de verdade,
// distintos entre si — usados pra decidir quais treinamentos cada um recebe
// automaticamente (ver src/lib/assignments.ts). Nenhum dos três dá acesso
// de Administrador por conta própria — elevar pra Admin continua
// sendo feito manualmente em Admin > Usuários. Desde a rodada 40, todo
// autocadastro também fica PENDENTE até um admin aprovar o acesso.
const TIPO_TO_ROLE = {
  TECNICO: "TECNICO",
  RC: "RC",
  FUNCIONARIO_BMC: "FUNCIONARIO",
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
  const phoneRaw = String(formData.get("phone") || "").trim();
  const cepDigits = onlyDigits(String(formData.get("cep") || ""));
  const street = String(formData.get("street") || "").trim();
  const number = String(formData.get("number") || "").trim();
  const complement = String(formData.get("complement") || "").trim();
  const neighborhood = String(formData.get("neighborhood") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = normalizeUf(String(formData.get("state") || ""));
  const tipo = String(formData.get("tipo") || "") as keyof typeof TIPO_TO_ROLE;

  if (!name) {
    return { error: "Informe seu nome completo." };
  }
  if (!isValidCpf(cpf)) {
    return { error: "CPF inválido. Confira os 11 números." };
  }
  if (cnpj && !isValidCnpj(cnpj)) {
    return { error: "CNPJ inválido. Confira os 14 números ou deixe em branco." };
  }
  // Contato telefônico obrigatório (rodada 43): a equipe liga se precisar
  // confirmar o cadastro antes de aprovar.
  if (!isValidPhone(phoneRaw)) {
    return { error: "Informe um telefone com DDD, por exemplo (91) 99999-9999." };
  }
  if (cepDigits.length !== 8) {
    return { error: "Informe o CEP com 8 números." };
  }
  if (!street) {
    return { error: "Informe a rua do seu endereço." };
  }
  if (!number) {
    return { error: "Informe o número da residência." };
  }
  if (!neighborhood) {
    return { error: "Informe o bairro." };
  }
  if (!city) {
    return { error: "Informe sua cidade." };
  }
  if (!state) {
    return { error: "Selecione o seu estado (UF)." };
  }
  if (!TIPO_TO_ROLE[tipo]) {
    return { error: "Selecione seu tipo de vínculo." };
  }

  const role = TIPO_TO_ROLE[tipo];
  const cep = `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`;
  // Endereço em texto único (usado nas telas que já existem): "Rua, nº - compl., Bairro".
  const address = `${street}, ${number}${complement ? ` - ${complement}` : ""}, ${neighborhood}`;

  await db
    .update(users)
    .set({
      name,
      cpf,
      cnpj: cnpj || null,
      phone: formatPhone(phoneRaw),
      address,
      cep,
      city,
      state,
      position: TIPO_TO_POSITION_LABEL[tipo],
      role,
      profileCompleted: true,
    })
    .where(eq(users.id, session.userId!));

  await logAudit(session.userId!, "PROFILE_COMPLETED", { tipo, role });

  // Rodada 40: quem veio do autocadastro público fica PENDENTE até um admin
  // aprovar. Os treinamentos só são atribuídos na aprovação (ver
  // updateApprovalStatusAction); aqui avisamos os admins que há alguém novo.
  const [current] = await db
    .select({ approvalStatus: users.approvalStatus, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId!));
  if (current?.approvalStatus === "APROVADO") {
    // Pedido do Telles (rodada 14): conta já aprovada recebe os treinamentos
    // publicados do perfil escolhido, sem atribuição manual.
    await assignPublishedTrainingsToUser(session.userId!, role);
  } else {
    await notifyAdminsPendingSignup({ name, email: current?.email ?? session.email ?? "" });
  }

  const updatedSession = await getSession();
  updatedSession.name = name;
  updatedSession.role = role;
  updatedSession.profileCompleted = true;
  await updatedSession.save();

  return { success: true };
}
