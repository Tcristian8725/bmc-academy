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
// mm:ss (ou h:mm:ss para vídeos com mais de uma hora) para o tempo do player
// de controles próprios.
function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

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
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    setVolume: (volume: number) => void;
    getVolume: () => number;
    mute: () => void;
    unMute: () => void;
    isMuted: () => boolean;
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

  // Estado só da UI dos controles próprios (ver comentário em video.ts sobre
  // por que `controls=0` — sem isso, some junto o play/pause/barra de
  // progresso nativos do YouTube, então recriamos aqui).
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [ready, setReady] = useState(false);
  const seekingRef = useRef(false);

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

          // Atualiza a posição mostrada na barra de progresso própria
          // (diferente do "tempo assistido" acima) — só quando a pessoa não
          // está arrastando a barra manualmente, pra não brigar com o gesto.
          if (!seekingRef.current) {
            setCurrentTime(player.getCurrentTime());
          }
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
            setReady(true);
            const d = e.target?.getDuration?.();
            if (d) setDuration(d);
            const v = e.target?.getVolume?.();
            if (typeof v === "number") setVolume(v);
            setMuted(Boolean(e.target?.isMuted?.()));
          },
          onStateChange: (e: { data: number; target: typeof playerRef.current }) => {
            playerRef.current = e.target;
            const d = e.target?.getDuration?.();
            if (d) setDuration(d);
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (e.data === 1) {
              setIsPlaying(true);
              startPolling();
            } else {
              setIsPlaying(false);
              stopPolling();
              if (!seekingRef.current) {
                setCurrentTime(e.target?.getCurrentTime?.() ?? 0);
              }
              // O vídeo pode "terminar" (ENDED) sem ter sido de fato
              // assistido (ex.: a pessoa pulou direto pro final) — reporta
              // o acumulado real, sem forçar 100% automaticamente.
              if (d) send((accumulatedSecondsRef.current / d) * 100);
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

  function togglePlay() {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  // `type="range"` dispara `onChange` só ao soltar — usamos `onInput` pra já
  // mover visualmente a bolinha enquanto arrasta, e só chamamos `seekTo` (que
  // afeta o vídeo de verdade) quando a pessoa solta o controle.
  function handleSeekInput(e: React.FormEvent<HTMLInputElement>) {
    seekingRef.current = true;
    setCurrentTime(Number(e.currentTarget.value));
  }

  function handleSeekCommit(e: React.ChangeEvent<HTMLInputElement> | React.PointerEvent<HTMLInputElement>) {
    const value = Number((e.target as HTMLInputElement).value);
    playerRef.current?.seekTo(value, true);
    seekingRef.current = false;
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    playerRef.current?.setVolume(next);
    if (next > 0 && muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
  }

  return (
    <div>
      {/* Controles nativos do YouTube desligados (ver video.ts) pra tirar o
          ícone de compartilhar/assistir depois e o botão "Assista no
          YouTube" — os controles abaixo (play/pause, progresso, volume) são
          próprios, feitos com a IFrame API do YouTube. */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          id={iframeId.current}
          src={embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={title}
        />

        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition hover:bg-black/10"
        >
          {!isPlaying && (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          )}
        </button>

        <div
          className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            className="shrink-0 text-white"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <span className="shrink-0 text-[11px] tabular-nums text-white/80">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={Math.min(currentTime, duration || 0)}
            onInput={handleSeekInput}
            onChange={handleSeekCommit}
            disabled={!ready || !duration}
            aria-label="Progresso do vídeo"
            className="h-1 flex-1 accent-white"
          />

          <button
            type="button"
            onClick={toggleMute}
            disabled={!ready}
            aria-label={muted ? "Ativar som" : "Desativar som"}
            className="shrink-0 text-white"
          >
            {muted || volume === 0 ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M18.36 5.64a9 9 0 0 1 0 12.73" />
              </svg>
            )}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            disabled={!ready}
            aria-label="Volume"
            className="h-1 w-14 shrink-0 accent-white"
          />
        </div>
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
