"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Carrossel da TV do painel (pedido do Telles): o vídeo local de máquinas
// Hyundai + dois vídeos do YouTube que ele mandou, tocando em sequência e
// voltando ao primeiro depois do último. Todos começam mudos (regra do
// navegador para autoplay) com o mesmo botão de som/volume de antes, agora
// valendo para o item que estiver tocando no momento.
type CarouselItem =
  | { type: "local"; src: string; title: string }
  | { type: "youtube"; videoId: string; title: string };

const ITEMS: CarouselItem[] = [
  {
    type: "local",
    src: "/branding/tv-maquinas-hyundai.mp4",
    title: "Linha Amarela Hyundai",
  },
  { type: "youtube", videoId: "ZVpKW2c4HIk", title: "Linha Amarela Hyundai" },
  { type: "youtube", videoId: "K2Rl86dnHHQ", title: "Linha Amarela Hyundai" },
  { type: "youtube", videoId: "Ntjg0lszSFc", title: "Linha Amarela Hyundai" },
  { type: "youtube", videoId: "I7PaUPjEhF0", title: "Linha Amarela Hyundai" },
];

const DEFAULT_VOLUME = 0.5;
const YT_CONTAINER_ID = "tv-panel-yt-player";

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, options: Record<string, unknown>) => YTPlayerInstance;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
}

export default function TvPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const item = ITEMS[index];
  const localItem = ITEMS.find((i) => i.type === "local") as
    | Extract<CarouselItem, { type: "local" }>
    | undefined;
  const firstYouTubeItem = ITEMS.find((i) => i.type === "youtube") as
    | Extract<CarouselItem, { type: "youtube" }>
    | undefined;

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % ITEMS.length);
  }, []);

  // Troca de item: toca/pausa o vídeo local e o player do YouTube conforme
  // qual dos dois está "no ar" agora.
  useEffect(() => {
    const video = videoRef.current;
    if (item.type === "local") {
      if (video) {
        video.currentTime = 0;
        video.muted = muted;
        video.volume = volume;
        video.play().catch(() => {});
      }
      ytPlayerRef.current?.pauseVideo();
    } else {
      video?.pause();
      const player = ytPlayerRef.current;
      if (player) {
        player.loadVideoById(item.videoId);
        if (muted) {
          player.mute();
        } else {
          player.unMute();
          player.setVolume(Math.round(volume * 100));
        }
        player.playVideo();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Cria o player do YouTube uma única vez (em segundo plano, ainda que o
  // primeiro item da vez seja o vídeo local) para já estar pronto quando
  // chegar a vez dele.
  useEffect(() => {
    if (!firstYouTubeItem) return;
    let cancelled = false;

    function createPlayer() {
      if (cancelled || ytPlayerRef.current || !window.YT) return;
      ytPlayerRef.current = new window.YT.Player(YT_CONTAINER_ID, {
        videoId: firstYouTubeItem!.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            // Se, enquanto o player carregava, o carrossel já chegou num
            // vídeo do YouTube, começa a tocar ele agora.
            const current = ITEMS[indexRef.current];
            if (current.type === "youtube") {
              const player = ytPlayerRef.current;
              if (!player) return;
              player.loadVideoById(current.videoId);
              if (mutedRef.current) {
                player.mute();
              } else {
                player.unMute();
                player.setVolume(Math.round(volumeRef.current * 100));
              }
              player.playVideo();
            }
          },
          onStateChange: (e: { data: number }) => {
            if (window.YT && e.data === window.YT.PlayerState.ENDED) {
              advance();
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existingScript = document.getElementById("youtube-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refs "espelho" pra ler o valor mais recente de dentro do callback
  // onReady acima (que é registrado uma única vez, na criação do player).
  const indexRef = useRef(index);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  function toggleSound() {
    const next = !muted;
    if (item.type === "local" && videoRef.current) {
      videoRef.current.muted = next;
      if (!next) {
        videoRef.current.volume = volume;
        videoRef.current.play().catch(() => {
          // Se o navegador ainda recusar o som, volta a mostrar como mudo.
          setMuted(true);
          return;
        });
      }
    } else if (item.type === "youtube" && ytPlayerRef.current) {
      if (next) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(Math.round(volume * 100));
      }
    }
    setMuted(next);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    if (item.type === "local" && videoRef.current) {
      videoRef.current.volume = next;
    } else if (item.type === "youtube" && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(Math.round(next * 100));
    }
  }

  return (
    <div className="xl:sticky xl:top-8 xl:self-start">
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-2 shadow-sm ring-1 ring-black/5">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {localItem && (
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${item.type === "local" ? "block" : "hidden"}`}
              src={localItem.src}
              muted
              playsInline
              onEnded={advance}
            />
          )}
          <div
            id={YT_CONTAINER_ID}
            className={`h-full w-full ${item.type === "youtube" ? "block" : "hidden"}`}
          />
        </div>
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
          {item.title}
        </p>
      </div>
    </div>
  );
}
