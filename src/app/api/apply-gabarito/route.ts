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
 *     &images=1:/exam-images/x/q01.jpg,2:/exam-images/x/q02.jpg,...  (opcional — questão:URL/caminho da imagem)
 *     &minScorePercent=80               (opcional — muda a nota mínima de aprovação da prova)
 *     &videoUrl=https://youtube.com/...  (opcional — cadastra/atualiza o vídeo da entrega técnica)
 *     &videoTitle=Vídeo ...              (opcional — título da lição de vídeo, tem um padrão)
 *     &publish=true                     (opcional — publica o treinamento e atribui ao público-alvo)
 *     &audience=TECNICO,RC              (opcional — quem recebe automaticamente; ver AUDIENCE_ROLES
 *                                         em src/lib/assignments.ts. Se não informado, mantém o
 *                                         público-alvo atual do treinamento, ou TECNICO,RC por padrão
 *                                         se for a primeira vez.)
 *
 * Seguro de rodar mais de uma vez (idempotente) — só atualiza qual alternativa
 * está marcada como correta em cada questão informada; nunca apaga nada, exceto
 * a lição de vídeo placeholder (texto "link pendente"), que é substituída pela
 * lição de vídeo real quando videoUrl é informado.
 *
 * `publish=true` também atribui o treinamento (obrigatório) a todos os
 * usuários ativos cujo papel bate com `audience` (ou o público-alvo já salvo
 * do treinamento) — publicar sozinho não deixava visível em "Meus
 * treinamentos" sem uma atribuição manual pelo admin. Pedido do Telles
 * (rodada 14): antes de publicar um treinamento novo, perguntar a ele se é
 * pra Técnico, RC ou Funcionário BMC, em vez de assumir TECNICO+RC sempre.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trainings, exams, questions, answers, lessons } from "@/db/schema";
import { formatAudienceRoles, syncTrainingAssignments } from "@/lib/assignments";

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
  const images = req.nextUrl.searchParams.get("images");
  const minScorePercentRaw = req.nextUrl.searchParams.get("minScorePercent");
  const videoUrl = req.nextUrl.searchParams.get("videoUrl");
  const videoTitle = req.nextUrl.searchParams.get("videoTitle") || "Vídeo da Entrega Técnica";
  const publish = req.nextUrl.searchParams.get("publish") === "true";
  const audienceRaw = req.nextUrl.searchParams.get("audience");

  if (!examCode || (!key && !images && !minScorePercentRaw && !videoUrl)) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros obrigatórios: examCode e (key e/ou images e/ou minScorePercent e/ou videoUrl)." },
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

    if (key) {
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
    }

    if (images) {
      const imgPairs = images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const pair of imgPairs) {
        const idx = pair.indexOf(":");
        if (idx < 0) {
          log.push(`Imagem ignorada (formato inválido): "${pair}"`);
          continue;
        }
        const qNum = Number(pair.slice(0, idx).trim());
        const url = pair.slice(idx + 1).trim();
        const question = examQuestions.find((q) => q.order === qNum);
        if (!question || !url) {
          log.push(`Imagem da questão ${qNum} não aplicada (questão ou URL inválida) — pulando.`);
          continue;
        }
        await db.update(questions).set({ imageUrl: url }).where(eq(questions.id, question.id));
        log.push(`Questão ${qNum}: imagem definida (${url}).`);
      }
    }

    if (minScorePercentRaw) {
      const minScorePercent = Number(minScorePercentRaw);
      if (!Number.isFinite(minScorePercent) || minScorePercent < 0 || minScorePercent > 100) {
        log.push(`minScorePercent inválido: "${minScorePercentRaw}" — ignorado.`);
      } else {
        await db.update(exams).set({ minScorePercent }).where(eq(exams.id, exam.id));
        log.push(`Nota mínima de aprovação atualizada para ${minScorePercent}%.`);
      }
    }

    if (videoUrl) {
      const trainingLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.trainingId, training.id))
        .orderBy(lessons.order);

      const existingVideoLesson = trainingLessons.find((l) => l.type === "VIDEO");
      // lição placeholder criada por import-real-exams.ts, com o link do vídeo
      // ainda pendente — identificada pelo título fixo usado lá.
      const placeholderLesson = trainingLessons.find(
        (l) => l.type === "TEXT" && l.title === "Vídeo de Entrega Técnica (link pendente)"
      );

      if (existingVideoLesson) {
        await db
          .update(lessons)
          .set({ url: videoUrl, title: videoTitle })
          .where(eq(lessons.id, existingVideoLesson.id));
        log.push(`Lição de vídeo existente atualizada com o novo link (${videoUrl}).`);
      } else if (placeholderLesson) {
        await db.delete(lessons).where(eq(lessons.id, placeholderLesson.id));
        await db.insert(lessons).values({
          trainingId: training.id,
          title: videoTitle,
          order: placeholderLesson.order,
          type: "VIDEO",
          url: videoUrl,
        });
        log.push(`Lição placeholder substituída por lição de vídeo (${videoUrl}).`);
      } else {
        const nextOrder =
          trainingLessons.length > 0 ? Math.max(...trainingLessons.map((l) => l.order)) + 1 : 1;
        await db.insert(lessons).values({
          trainingId: training.id,
          title: videoTitle,
          order: nextOrder,
          type: "VIDEO",
          url: videoUrl,
        });
        log.push(`Lição de vídeo criada (${videoUrl}).`);
      }
    }

    if (audienceRaw) {
      const audienceFormatted = formatAudienceRoles(audienceRaw.split(","));
      await db
        .update(trainings)
        .set({ audienceRoles: audienceFormatted })
        .where(eq(trainings.id, training.id));
      log.push(`Público-alvo definido: ${audienceFormatted}.`);
    }

    if (publish) {
      await db
        .update(trainings)
        .set({ published: true, publishedAt: new Date().toISOString() })
        .where(eq(trainings.id, training.id));
      log.push("Treinamento publicado.");

      // Atribui o treinamento (obrigatório) a todos os usuários ativos cujo
      // papel bate com o público-alvo do treinamento (audienceRoles) —
      // publicar sozinho não deixa o treinamento visível em "Meus
      // treinamentos" de ninguém sem uma atribuição.
      const assignedCount = await syncTrainingAssignments(training.id);
      if (assignedCount > 0) {
        log.push(`Treinamento atribuído (obrigatório) a ${assignedCount} usuário(s).`);
      } else {
        log.push("Todos os usuários do público-alvo já tinham esse treinamento atribuído.");
      }
    }

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    log.push(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
