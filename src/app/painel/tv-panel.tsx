"use client";

import { useEffect, useRef, useState } from "react";

// Pedido do Telles: o vídeo da TV começa mudo porque os navegadores bloqueiam
// autoplay com som (só autoplay silencioso é permitido sem o usuário clicar
// em algo primeiro). O botão de alto-falante ativa o som manualmente — o
// clique conta como a interação que o navegador exige — e, quando ativado,
// começa em 50% do volume (não no máximo), com um controle deslizante ao
// lado pra ajustar mais, pra cima ou pra baixo, quando quiser.
const DEFAULT_VOLUME = 0.5;

export default function TvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = DEFAULT_VOLUME;
    }
  }, []);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    if (!next) {
      video.volume = volume;
      video.play().catch(() => {
        // Se o navegador ainda recusar o som, volta a mostrar como mudo.
        setMuted(true);
        return;
      });
    }
    setMuted(next);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    if (videoRef.current) {
      videoRef.current.volume = next;
    }
  }

  return (
    <div className="xl:sticky xl:top-8 xl:self-start">
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-2 shadow-sm ring-1 ring-black/5">
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-xl object-cover"
          src="/branding/tv-maquinas-hyundai.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {!muted && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume do vídeo"
              title="Volume"
              className="h-1 w-16 accent-white"
            />
          )}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Ativar som do vídeo" : "Desativar som do vídeo"}
            title={muted ? "Ativar som" : "Desativar som"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          >
            {muted ? (
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
        </div>
        <p className="px-1 pb-1 pt-2 text-center text-[11px] font-medium uppercase tracking-wide text-white/60">
          Linha Amarela Hyundai
        </p>
      </div>
    </div>
  );
}
