"use client";

import { useRef, useState } from "react";

// Pedido do Telles: o vídeo da TV começa mudo porque os navegadores bloqueiam
// autoplay com som (só autoplay silencioso é permitido sem o usuário clicar
// em algo primeiro). Esse botão de alto-falante deixa a pessoa ativar o som
// manualmente — o clique conta como a interação que o navegador exige.
export default function TvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    if (!next) {
      video.play().catch(() => {
        // Se o navegador ainda recusar o som, volta a mostrar como mudo.
        setMuted(true);
        return;
      });
    }
    setMuted(next);
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
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Ativar som do vídeo" : "Desativar som do vídeo"}
          title={muted ? "Ativar som" : "Desativar som"}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
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
        <p className="px-1 pb-1 pt-2 text-center text-[11px] font-medium uppercase tracking-wide text-white/60">
          Linha Amarela Hyundai
        </p>
      </div>
    </div>
  );
}
