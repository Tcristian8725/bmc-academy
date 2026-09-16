import { db } from "@/db";
import { notificationLogs } from "@/db/schema";

/**
 * Serviço de notificação por e-mail — seção 13 do Prompt Mestre.
 *
 * Nenhum provedor definitivo foi escolhido ainda (aguardando decisão do Telles/BMC).
 * Por padrão, este serviço apenas REGISTRA a notificação (transporte "console/log"),
 * sem enviar de verdade — assim dá pra ver o conteúdo do e-mail e o histórico sem
 * depender de nenhuma conta paga.
 *
 * Para ligar o envio real no futuro, basta implementar `sendViaProvider` usando
 * Resend, SendGrid, Amazon SES (todos têm camada gratuita) e trocar a chamada
 * abaixo — o restante do sistema (NotificationLog, gatilhos) não muda.
 */

interface NotificationInput {
  toEmail: string;
  subject: string;
  body: string;
  relatedTrainingId?: string;
  relatedUserId?: string;
}

export async function sendNotification(input: NotificationInput) {
  // TODO (fase 10 — E-mail): plugar provedor real aqui quando definido.
  const simulated = true;

  console.log(`\n[e-mail simulado] Para: ${input.toEmail}`);
  console.log(`Assunto: ${input.subject}`);
  console.log(input.body);
  console.log("---");

  await db.insert(notificationLogs).values({
    toEmail: input.toEmail,
    subject: input.subject,
    body: input.body,
    status: simulated ? "SIMULADO" : "ENVIADO",
    relatedTrainingId: input.relatedTrainingId,
    relatedUserId: input.relatedUserId,
  });
}

export function certificateApprovedUserEmail(params: {
  userName: string;
  trainingTitle: string;
  scorePercent: number;
  completedAt: string;
  certificateUrl: string;
}) {
  return {
    subject: `Parabéns! Você concluiu "${params.trainingTitle}" — BMC Academy`,
    body: `Olá, ${params.userName}!

Parabéns por concluir o treinamento "${params.trainingTitle}" com nota ${params.scorePercent.toFixed(
      0
    )}%, em ${params.completedAt}.

Seu certificado já está disponível para download:
${params.certificateUrl}

Continue acompanhando seus treinamentos na BMC Academy.

— BMC Academy`,
  };
}

export function certificateApprovedManagerEmail(params: {
  managerLabel: string; // ex.: "gestores da equipe" — sem inventar nomes/e-mails reais
  employeeName: string;
  employeeRole: string;
  trainingTitle: string;
  scorePercent: number;
  completedAt: string;
}) {
  return {
    subject: `${params.employeeName} concluiu "${params.trainingTitle}" — BMC Academy`,
    body: `Olá,

Informamos que ${params.employeeName} (${params.employeeRole}) concluiu e foi aprovado(a) no treinamento "${params.trainingTitle}", com nota ${params.scorePercent.toFixed(
      0
    )}%, em ${params.completedAt}.

O certificado está disponível no histórico do colaborador na BMC Academy.

— BMC Academy (notificação automática para ${params.managerLabel})`,
  };
}
