"use client";

import { useState } from "react";

export interface LibraryVideo {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  embedUrl: string;
}

/** Lista pesquisável de vídeos de consulta técnica. Cada vídeo abre inline
 * (clique no card) com o player nativo do YouTube — sem medição de tempo,
 * sem trava, sem prova (rodada 39). */
export default function VideoLibrary({ videos }: { videos: LibraryVideo[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? videos.filter((v) =>
        [v.title, v.description ?? "", v.topic ?? ""].some((t) => t.toLowerCase().includes(q))
      )
    : videos;

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título, equipamento ou tema…"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      />
      {filtered.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          {videos.length === 0
            ? "Nenhum vídeo de diagnóstico disponível ainda."
            : "Nenhum vídeo encontrado para essa busca."}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((v) => {
          const open = openId === v.id;
          return (
            <div key={v.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              {open ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={v.embedUrl}
                    title={v.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenId(v.id)}
                  className="flex aspect-video w-full items-center justify-center bg-gray-900 text-white transition hover:bg-gray-800"
                >
                  <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900">
                    ▶ Assistir
                  </span>
                </button>
              )}
              <div className="p-4">
                <p className="font-medium text-foreground">{v.title}</p>
                {v.topic && <p className="text-xs font-medium text-brand">{v.topic}</p>}
                {v.description && <p className="mt-1 text-xs text-gray-500">{v.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
