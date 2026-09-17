"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitExamAction } from "./actions";
import type { SubmitExamResult } from "@/lib/training-flow";

type Question = {
  id: string;
  type: string;
  statement: string;
  explanation: string | null;
  imageUrl?: string | null;
  answers: { id: string; text: string }[];
};

export default function ExamForm({
  examId,
  trainingId,
  questions,
  attemptsRemaining,
}: {
  examId: string;
  trainingId: string;
  questions: Question[];
  attemptsRemaining: number;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<SubmitExamResult | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(questionId: string, answerId: string, multi: boolean) {
    setSelected((prev) => {
      const current = prev[questionId] ?? [];
      if (multi) {
        const exists = current.includes(answerId);
        return {
          ...prev,
          [questionId]: exists ? current.filter((a) => a !== answerId) : [...current, answerId],
        };
      }
      return { ...prev, [questionId]: [answerId] };
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitExamAction(examId, selected);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <div
        className={`rounded-xl p-6 ${
          result.passed ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-red-50 ring-1 ring-red-200"
        }`}
      >
        <h2 className="text-lg font-semibold">
          {result.passed ? "Aprovado! 🎉" : "Não foi desta vez"}
        </h2>
        <p className="mt-1 text-sm text-gray-700">
          Nota: {result.scorePercent?.toFixed(0)}%
        </p>

        {result.passed && result.certificateUrl && (
          <a
            href={result.certificateUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Baixar certificado (PDF)
          </a>
        )}

        {!result.passed && (
          <Link
            href={`/painel/treinamentos/${trainingId}`}
            className="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            Voltar ao treinamento
          </Link>
        )}

        {result.isCorrectByQuestion && (
          <div className="mt-6 space-y-3 border-t border-black/10 pt-4">
            <p className="text-sm font-medium text-gray-700">Resultado por questão:</p>
            {questions.map((q, idx) => {
              const acertou = result.isCorrectByQuestion?.[q.id];
              return (
                <div key={q.id} className="text-sm text-gray-600">
                  <p className="font-medium">
                    {idx + 1}. {q.statement}{" "}
                    <span
                      className={acertou ? "text-emerald-600" : "text-red-600"}
                    >
                      {acertou ? "✓ Você acertou" : "✗ Você errou"}
                    </span>
                  </p>
                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.imageUrl}
                      alt=""
                      className="my-2 max-h-56 rounded-lg border border-gray-200 object-contain"
                    />
                  )}
                  {acertou ? (
                    <>
                      <p>
                        Correta(s):{" "}
                        {q.answers
                          .filter((a) => result.correctByQuestion?.[q.id]?.includes(a.id))
                          .map((a) => a.text)
                          .join(", ")}
                      </p>
                      {q.explanation && <p className="italic text-gray-500">{q.explanation}</p>}
                    </>
                  ) : (
                    <p className="italic text-gray-400">
                      Resposta correta não exibida — revise o conteúdo do treinamento antes de
                      tentar novamente.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (attemptsRemaining <= 0) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-sm text-red-700 ring-1 ring-red-200">
        Você atingiu o número máximo de tentativas para esta prova.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {result && !result.ok && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>
      )}
      {questions.map((q, idx) => {
        const multi = q.type === "MULTIPLA_RESPOSTA";
        return (
          <div key={q.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="mb-3 font-medium text-foreground">
              {idx + 1}. {q.statement}
            </p>
            {q.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.imageUrl}
                alt={`Imagem da questão ${idx + 1}`}
                className="mb-3 max-h-72 w-full rounded-lg border border-gray-200 object-contain"
              />
            )}
            <div className="space-y-2">
              {q.answers.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={q.id}
                    checked={(selected[q.id] ?? []).includes(a.id)}
                    onChange={() => toggle(q.id, a.id, multi)}
                    className="accent-[--color-brand]"
                  />
                  {a.text}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar respostas"}
      </button>
    </div>
  );
}
