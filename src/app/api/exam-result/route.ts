/**
 * Rota utilitária (protegida pelo mesmo SETUP_TOKEN) para diagnosticar e, se
 * necessário, corrigir o resultado de uma tentativa de prova que já foi
 * enviada — útil para os casos em que a emissão do certificado falhou (bug
 * corrigido: geração de PDF tentava gravar em arquivo, que não funciona nas
 * funções serverless da Vercel — ver src/lib/certificate.ts) ou quando a
 * nota mínima de aprovação foi alterada depois da tentativa.
 *
 * Reavalia SEMPRE contra a nota mínima ATUAL da prova (não a de quando a
 * pessoa fez a prova) e, se passou e ainda não existe certificado, emite um
 * agora (sem duplicar se já existir).
 *
 * Uso:
 *   https://SEU-APP.vercel.app/api/exam-result
 *     ?token=SEU_TOKEN
 *     &examCode=ENTREGA-HB640C
 *     &email=pessoa@bmchyundai.com.br
 */
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trainings, exams, examAttempts, certificates, users } from "@/db/schema";
import { issueCertificateForTraining } from "@/lib/training-flow";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SETUP_TOKEN não configurado nas variáveis de ambiente do Vercel." },
      { status: 500 }
    );
  }
  if (token !== expected) {
    return NextResponse.json({ ok: false, error: "Token inválido." }, { status: 401 });
  }

  const examCode = req.nextUrl.searchParams.get("examCode");
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!examCode || !email) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros obrigatórios: examCode e email." },
      { status: 400 }
    );
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return NextResponse.json({ ok: false, error: `Usuário "${email}" não encontrado.` }, { status: 404 });
    }

    const [training] = await db.select().from(trainings).where(eq(trainings.code, examCode));
    if (!training) {
      return NextResponse.json(
        { ok: false, error: `Nenhum treinamento com código "${examCode}".` },
        { status: 404 }
      );
    }

    const [exam] = await db.select().from(exams).where(eq(exams.trainingId, training.id));
    if (!exam) {
      return NextResponse.json(
        { ok: false, error: "Este treinamento não tem prova cadastrada." },
        { status: 404 }
      );
    }

    const allAttempts = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.examId, exam.id), eq(examAttempts.userId, user.id)))
      .orderBy(desc(examAttempts.attemptNumber));

    const [lastAttempt] = allAttempts;

    if (!lastAttempt) {
      return NextResponse.json({
        ok: true,
        found: false,
        message: "Nenhuma tentativa registrada para esse usuário nesta prova.",
      });
    }

    const scorePercent = lastAttempt.scorePercent ?? 0;
    const passedNow = scorePercent >= exam.minScorePercent;

    // mantém o histórico da tentativa coerente com a regra atual
    if (lastAttempt.passed !== passedNow) {
      await db
        .update(examAttempts)
        .set({ passed: passedNow })
        .where(eq(examAttempts.id, lastAttempt.id));
    }

    const [existingCertificate] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, user.id), eq(certificates.trainingId, training.id)));

    let certificateUrl = existingCertificate?.pdfPath;
    let issuedNow = false;

    if (passedNow && !existingCertificate) {
      certificateUrl = await issueCertificateForTraining(user.id, training.id, scorePercent);
      issuedNow = true;
    }

    return NextResponse.json({
      ok: true,
      found: true,
      user: { name: user.name, email: user.email },
      training: { code: training.code, title: training.title },
      attemptNumber: lastAttempt.attemptNumber,
      allAttempts: allAttempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        scorePercent: a.scorePercent,
        passed: a.passed,
        submittedAt: a.submittedAt,
      })),
      scorePercent,
      minScorePercent: exam.minScorePercent,
      passed: passedNow,
      hadCertificateAlready: !!existingCertificate,
      issuedNow,
      certificateUrl,
    });
  } catch (err) {
    // status 200 mesmo em erro de propósito: esta é uma rota de diagnóstico
    // chamada via ferramenta externa que não consegue ler o corpo de uma
    // resposta com status de erro — sem isso, a mensagem real do erro fica
    // invisível para depuração.
    // Percorre a cadeia de "cause" (drizzle envolve o erro real do driver pg
    // em "Failed query: ..." e guarda o erro original em err.cause).
    const causes: string[] = [];
    let cur: unknown = err;
    let depth = 0;
    while (cur && depth < 5) {
      if (cur instanceof Error) {
        causes.push(cur.message);
        cur = (cur as { cause?: unknown }).cause;
      } else {
        causes.push(String(cur));
        cur = undefined;
      }
      depth++;
    }
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        causes,
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 200 }
    );
  }
}
