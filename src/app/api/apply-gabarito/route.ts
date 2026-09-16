/**
 * Rota utilitária (protegida pelo mesmo SETUP_TOKEN de /api/setup) para
 * aplicar o gabarito de uma prova real de uma vez só, direto pela URL —
 * sem precisar marcar checkbox por checkbox em Admin > Treinamentos.
 *
 * Uso: abrir no navegador (uma vez por prova):
 *   https://SEU-APP.vercel.app/api/apply-gabarito
 *     ?token=SEU_TOKEN
 *     &examCode=ENTREGA-HB640C          (código do treinamento, ver trainings.code)
 *     &key=1D,2B,3A,4C,5D,...           (questão:letra, separado por vírgula)
 *     &publish=true                     (opcional — publica o treinamento no final)
 *
 * Seguro de rodar mais de uma vez (idempotente) — só atualiza qual alternativa
 * está marcada como correta em cada questão informada; nunca apaga nada.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trainings, exams, questions, answers } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LETTER_TO_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };

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
  const key = req.nextUrl.searchParams.get("key");
  const publish = req.nextUrl.searchParams.get("publish") === "true";

  if (!examCode || !key) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros obrigatórios: examCode e key." },
      { status: 400 }
    );
  }

  const log: string[] = [];
  try {
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

    const examQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.examId, exam.id))
      .orderBy(questions.order);

    const pairs = key
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const pair of pairs) {
      const m = pair.match(/^(\d+)\s*[-:]?\s*([A-Da-d])$/);
      if (!m) {
        log.push(`Ignorado (formato inválido): "${pair}"`);
        continue;
      }
      const qNum = Number(m[1]);
      const letter = m[2].toUpperCase();
      const question = examQuestions.find((q) => q.order === qNum);
      if (!question) {
        log.push(`Questão ${qNum} não encontrada — pulando.`);
        continue;
      }

      const qAnswers = await db.select().from(answers).where(eq(answers.questionId, question.id));
      const targetOrder = LETTER_TO_ORDER[letter];
      const target = qAnswers.find((a) => a.order === targetOrder);
      if (!target) {
        log.push(`Alternativa ${letter} da questão ${qNum} não encontrada — pulando.`);
        continue;
      }

      for (const a of qAnswers) {
        const shouldBeCorrect = a.id === target.id;
        if (a.correct !== shouldBeCorrect) {
          await db.update(answers).set({ correct: shouldBeCorrect }).where(eq(answers.id, a.id));
        }
      }
      log.push(`Questão ${qNum}: gabarito = ${letter} ("${target.text}")`);
    }

    if (publish) {
      await db
        .update(trainings)
        .set({ published: true, publishedAt: new Date().toISOString() })
        .where(eq(trainings.id, training.id));
      log.push("Treinamento publicado.");
    }

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    log.push(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
