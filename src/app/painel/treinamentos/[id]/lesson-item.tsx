"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { markLessonViewedAction, reportVideoProgressAction } from "./actions";
import { toEmbedUrl, isYouTubeEmbed } from "@/lib/video";

type Lesson = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  content: string | null;
};

// Carrega o script da IFrame API do YouTube uma única vez por página
// (várias lições de vídeo poderiam existir no mesmo treinamento no futuro).
let youtubeApiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { YT?: unknown }).YT) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prevCallback = (window as unknown as { onYouTubeIframeAPIReady?: () => void })
      .onYouTubeIframeAPIReady;
    (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady =
      () => {
        prevCallback?.();
        resolve();
      };
  });
  return youtubeApiPromise;
}

// Player YouTube com a API JS: mede o quanto do vídeo o usuário já assistiu
// de verdade, em vez de um botão manual "marcar como concluída" — a pedido
// do Telles, a prova só libera depois de pelo menos WATCH_THRESHOLD_PERCENT%
// assistido de fato.
//
// Importante: a medição é por TEMPO REAL DE REPRODUÇÃO acumulado (quantos
// segundos o vídeo passou tocando de verdade), não pela posição/timestamp
// atual do vídeo. A primeira versão usava a posição atual (maior ponto já
// alcançado) e isso permitia burlar avançando a barra do vídeo direto pro
// final sem assistir nada — o Telles pediu para permitir adiantar/atrasar a
// vontade, mas exigindo que a pessoa fique de fato reproduzindo o vídeo por
// pelo menos 70% da duração total. Como a contagem é por tempo tocado (um
// intervalo a cada segundo, só enquanto o player está em PLAYING), pular
// posição não adianta nada — só o tempo real com o vídeo tocando conta.
function YouTubeGatedPlayer({
  embedUrl,
  title,
  trainingId,
  lessonId,
  initialWatchedPercent,
  initialCompleted,
  onProgress,
}: {
  embedUrl: string;
  title: string;
  trainingId: string;
  lessonId: string;
  initialWatchedPercent: number;
  initialCompleted: boolean;
  onProgress: (watchedPercent: number, completed: boolean) => void;
}) {
  const iframeId = useRef(`yt-player-${lessonId}`);
  const playerRef = useRef<{
    getCurrentTime: () => number;
    getDuration: () => number;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef(initialWatchedPercent);
  // Segundos de reprodução real já acumulados (não é posição do vídeo).
  // Inicializado a partir do `initialWatchedPercent` assim que soubermos a
  // duração de verdade do vídeo (ver `ensureInitialized` abaixo).
  const accumulatedSecondsRef = useRef(0);
  const initializedRef = useRef(false);
  const lastTickAtRef = useRef<number | null>(null);
  const [watchedPercent, setWatchedPercent] = useState(initialWatchedPercent);
  const [completed, setCompleted] = useState(initialCompleted);

  useEffect(() => {
    let destroyed = false;

    loadYouTubeIframeApi().then(() => {
      if (destroyed) return;
      const YT = (window as unknown as { YT: any }).YT;

      const send = async (percent: number) => {
        const rounded = Math.round(percent);
        if (rounded <= lastSentRef.current) return; // só avança, nunca reporta retrocesso
        lastSentRef.current = rounded;
        setWatchedPercent(rounded);
        const result = await reportVideoProgressAction(trainingId, lessonId, rounded);
        if (result?.completed) setCompleted(true);
        onProgress(rounded, Boolean(result?.completed));
      };

      // Na primeira vez que conseguimos a duração real do vídeo, convertemos
      // o `initialWatchedPercent` (vindo do banco) de volta pra segundos, pra
      // continuar de onde parou em vez de zerar o acumulado.
      const ensureInitialized = (duration: number) => {
        if (initializedRef.current || !duration) return;
        accumulatedSecondsRef.current = (initialWatchedPercent / 100) * duration;
        initializedRef.current = true;
      };

      const startPolling = () => {
        if (pollRef.current) return;
        lastTickAtRef.current = Date.now();
        pollRef.current = setInterval(() => {
          const player = playerRef.current;
          if (!player) return;
          const duration = player.getDuration();
          if (!duration) return;
          ensureInitialized(duration);

          // Tempo real passado desde o último tick (não a posição do vídeo)
          // — assim, avançar/retroceder a barra não pula etapa nenhuma: só
          // conta o tempo em que o vídeo esteve de fato tocando. O cap de 2s
          // evita contar de mais se a aba ficou em segundo plano e o
          // navegador atrasou o timer.
          const now = Date.now();
          const last = lastTickAtRef.current ?? now;
          const elapsed = Math.min((now - last) / 1000, 2);
          lastTickAtRef.current = now;

          accumulatedSecondsRef.current = Math.min(
            duration,
            accumulatedSecondsRef.current + elapsed
          );
          send((accumulatedSecondsRef.current / duration) * 100);
        }, 1000);
      };

      const stopPolling = () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        lastTickAtRef.current = null;
      };

      new YT.Player(iframeId.current, {
        events: {
          onReady: (e: { target: typeof playerRef.current }) => {
            playerRef.current = e.target;
          },
          onStateChange: (e: { data: number; target: typeof playerRef.current }) => {
            playerRef.current = e.target;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (e.data === 1) {
              startPolling();
            } else {
              stopPolling();
              // O vídeo pode "terminar" (ENDED) sem ter sido de fato
              // assistido (ex.: a pessoa pulou direto pro final) — reporta
              // o acumulado real, sem forçar 100% automaticamente.
              const duration = e.target?.getDuration?.();
              if (duration) send((accumulatedSecondsRef.current / duration) * 100);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          id={iframeId.current}
          src={embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={title}
        />
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {completed
              ? "Vídeo assistido — pode fazer a prova."
              : `Assistido: ${watchedPercent}% (mínimo para liberar a prova: 70%)`}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-brand"}`}
            style={{ width: `${Math.min(100, watchedPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LessonItem({
  lesson,
  trainingId,
  completed,
  watchedPercent,
  onLessonCompleted,
}: {
  lesson: Lesson;
  trainingId: string;
  completed: boolean;
  watchedPercent: number;
  onLessonCompleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [isCompleted, setIsCompleted] = useState(completed);

  const embedUrl = lesson.type === "VIDEO" && lesson.url ? toEmbedUrl(lesson.url) : null;
  const isGatedVideo = embedUrl && isYouTubeEmbed(embedUrl);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-foreground">{lesson.title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {isCompleted ? "Concluída" : "Pendente"}
        </span>
      </div>

      {lesson.type === "TEXT" && (
        <p className="whitespace-pre-line text-sm text-gray-700">{lesson.content}</p>
      )}

      {lesson.type === "VIDEO" && embedUrl && isGatedVideo && (
        <YouTubeGatedPlayer
          embedUrl={embedUrl}
          title={lesson.title}
          trainingId={trainingId}
          lessonId={lesson.id}
          initialWatchedPercent={watchedPercent}
          initialCompleted={completed}
          onProgress={(_percent, done) => {
            if (done && !isCompleted) {
              setIsCompleted(true);
              onLessonCompleted?.();
            }
          }}
        />
      )}

      {lesson.type === "VIDEO" && embedUrl && !isGatedVideo && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe src={embedUrl} className="h-full w-full" allowFullScreen title={lesson.title} />
        </div>
      )}

      {lesson.type === "PDF" && lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Abrir material (PDF) ↗
        </a>
      )}

      {lesson.type === "LINK" && lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Abrir material ↗
        </a>
      )}

      {lesson.type === "SLIDES" && lesson.url && (
        <a
          href={lesson.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Abrir apresentação ↗
        </a>
      )}

      {/* Para vídeo, não existe botão manual — a conclusão só acontece
          assistindo de fato (YouTubeGatedPlayer acima). O botão manual
          continua só para os outros tipos de lição (texto, PDF, link, slides)
          e para um vídeo não reconhecido como YouTube (sem API de progresso). */}
      {!isCompleted && lesson.type !== "VIDEO" && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markLessonViewedAction(trainingId, lesson.id);
              setIsCompleted(true);
              onLessonCompleted?.();
            })
          }
          className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Marcar como concluída"}
        </button>
      )}

      {!isCompleted && lesson.type === "VIDEO" && !isGatedVideo && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markLessonViewedAction(trainingId, lesson.id);
              setIsCompleted(true);
              onLessonCompleted?.();
            })
          }
          className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Marcar como concluída"}
        </button>
      )}
    </div>
  );
}
