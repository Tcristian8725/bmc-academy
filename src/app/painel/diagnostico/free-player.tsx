"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Player livre (sem medição de tempo, sem trava) da biblioteca de Diagnóstico.
// Usa o embed do YouTube com `controls=0` (ver toEmbedUrl em video.ts) e
// controles próprios — é o único jeito de tirar o logo "YouTube" clicável que
// aparece por cima do vídeo e leva para o site do YouTube. Mesmo visual dos
// controles do player das aulas (play/pause, progresso, volume, CC, tela
// cheia), mas SEM registrar progresso.

let apiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return apiPromise;
}

function formatTime(total: number): string {
  if (!Number.isFinite(total) || total < 0) return "0:00";
  const s = Math.floor(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export default function FreePlayer({
  embedUrl,
  title,
  playerId,
}: {
  embedUrl: string;
  title: string;
  playerId: string;
}) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekingRef = useRef(false);
  const captionsOnRef = useRef(true);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!cssFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCssFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cssFullscreen]);

  function hideCaptions(player: any) {
    player.setOption?.("captions", "track", {});
    player.unloadModule?.("captions");
    player.unloadModule?.("cc");
  }

  useEffect(() => {
    let destroyed = false;
    let ytPlayer: any = null;
    loadYouTubeIframeApi().then(() => {
      if (destroyed) return;
      const YT = (window as any).YT;
      ytPlayer = new YT.Player(playerId, {
        events: {
          onReady: (e: any) => {
            playerRef.current = e.target;
            setReady(true);
            const d = e.target.getDuration?.();
            if (d) setDuration(d);
            const v = e.target.getVolume?.();
            if (typeof v === "number") setVolume(v);
            setMuted(Boolean(e.target.isMuted?.()));
            // A pessoa acabou de clicar em "Assistir": já começa a tocar.
            e.target.playVideo?.();
          },
          onStateChange: (e: any) => {
            playerRef.current = e.target;
            const d = e.target.getDuration?.();
            if (d) setDuration(d);
            if (!captionsOnRef.current) {
              hideCaptions(e.target);
              setTimeout(() => hideCaptions(e.target), 300);
              setTimeout(() => hideCaptions(e.target), 1200);
            }
            if (e.data === 1) {
              setIsPlaying(true);
              if (!pollRef.current) {
                pollRef.current = setInterval(() => {
                  const p = playerRef.current;
                  if (!p) return;
                  if (!seekingRef.current) setCurrentTime(p.getCurrentTime());
                  if (!captionsOnRef.current) hideCaptions(p);
                }, 500);
              }
            } else {
              setIsPlaying(false);
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
              if (!seekingRef.current) setCurrentTime(e.target.getCurrentTime?.() ?? 0);
            }
          },
        },
      });
    });
    return () => {
      destroyed = true;
      if (pollRef.current) clearInterval(pollRef.current);
      try {
        ytPlayer?.destroy?.();
      } catch {
        /* iframe já removido */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    playerRef.current?.setVolume(next);
    if (next > 0 && muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
  }

  function toggleCaptions() {
    const p = playerRef.current;
    if (!p) return;
    if (captionsOn) {
      captionsOnRef.current = false;
      setCaptionsOn(false);
      hideCaptions(p);
    } else {
      captionsOnRef.current = true;
      setCaptionsOn(true);
      p.loadModule?.("captions");
    }
  }

  function toggleFullscreen() {
    const el = containerRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (cssFullscreen) {
      setCssFullscreen(false);
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => setCssFullscreen(true));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else setCssFullscreen(true);
  }

  const fs = isFullscreen || cssFullscreen;

  return (
    <div
      ref={containerRef}
      className={
        cssFullscreen
          ? "group fixed inset-0 z-50 h-full w-full overflow-hidden bg-black"
          : "group relative aspect-video w-full overflow-hidden bg-black [&:fullscreen]:aspect-auto [&:fullscreen]:h-full"
      }
    >
      <iframe
        id={playerId}
        src={embedUrl}
        className="h-full w-full"
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        title={title}
      />

      {/* Camada transparente: clicar no vídeo = play/pause, e nada do YouTube
          (logo, título, "assistir depois") fica clicável. */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={!ready}
        aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition hover:bg-black/10"
      >
        {!isPlaying && ready && (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-6">
        <button type="button" onClick={togglePlay} disabled={!ready} aria-label={isPlaying ? "Pausar" : "Reproduzir"} className="shrink-0 text-white">
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
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
          onInput={(e) => {
            seekingRef.current = true;
            setCurrentTime(Number(e.currentTarget.value));
          }}
          onChange={(e) => {
            playerRef.current?.seekTo(Number(e.target.value), true);
            seekingRef.current = false;
          }}
          disabled={!ready || !duration}
          aria-label="Progresso do vídeo"
          className="h-1 min-w-0 flex-1 accent-white"
        />

        <button type="button" onClick={toggleMute} disabled={!ready} aria-label={muted ? "Ativar som" : "Desativar som"} className="shrink-0 text-white">
          {muted || volume === 0 ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M18.36 5.64a9 9 0 0 1 0 12.73" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={muted ? 0 : volume}
          onChange={handleVolume}
          disabled={!ready}
          aria-label="Volume"
          className="hidden h-1 w-14 shrink-0 accent-white sm:block"
        />

        <button
          type="button"
          onClick={toggleCaptions}
          disabled={!ready}
          aria-label={captionsOn ? "Desativar legenda" : "Ativar legenda"}
          aria-pressed={captionsOn}
          title={captionsOn ? "Remover legenda" : "Mostrar legenda"}
          className={`shrink-0 rounded px-1 text-[10px] font-bold leading-4 ring-1 ring-inset ${
            captionsOn ? "bg-white text-black ring-white" : "text-white ring-white/60"
          }`}
        >
          CC
        </button>

        <button type="button" onClick={toggleFullscreen} aria-label={fs ? "Sair da tela cheia" : "Tela cheia"} title={fs ? "Sair da tela cheia" : "Tela cheia"} className="shrink-0 text-white">
          {fs ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
