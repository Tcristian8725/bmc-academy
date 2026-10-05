import { requireUser } from "@/lib/auth";
import { listAllDiagnosticVideos } from "@/lib/diagnostic-videos";
import { formatDateBR } from "@/lib/datetime";
import {
  addDiagnosticVideoAction,
  deleteDiagnosticVideoAction,
  toggleDiagnosticVideoAction,
} from "./actions";

export default async function AdminDiagnosticoPage() {
  await requireUser(["ADMIN"]);
  const videos = await listAllDiagnosticVideos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Vídeos de diagnóstico</h1>
        <p className="text-sm text-gray-500">
          Biblioteca de consulta técnica em vídeo: sem prova, sem certificado e sem progresso.
          Todo Técnico, RC e Funcionário BMC vê os vídeos publicados na aba
          &quot;Diagnóstico&quot; do painel.
        </p>
      </div>

      <details open className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
        <summary className="cursor-pointer text-sm font-semibold text-brand">
          + Adicionar vídeo
        </summary>
        <form action={addDiagnosticVideoAction} className="mt-3 space-y-3">
          <input
            name="title"
            required
            placeholder="Título (ex.: Falha de partida — HX220)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="videoUrl"
            required
            type="url"
            placeholder="Link do vídeo (YouTube ou Vimeo)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="topic"
            placeholder="Equipamento / tema (opcional — ajuda na busca)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Adicionar vídeo
          </button>
        </form>
      </details>

      <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {videos.length === 0 && (
          <p className="p-6 text-sm text-gray-500">Nenhum vídeo adicionado ainda.</p>
        )}
        {videos.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{v.title}</p>
              <p className="truncate text-xs text-gray-500">
                {v.topic ? `${v.topic} · ` : ""}
                {formatDateBR(v.createdAt)} ·{" "}
                <a
                  href={v.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  abrir link
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  v.published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {v.published ? "Publicado" : "Oculto"}
              </span>
              <form action={toggleDiagnosticVideoAction.bind(null, v.id, !v.published)}>
                <button
                  type="submit"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {v.published ? "Ocultar" : "Publicar"}
                </button>
              </form>
              <form action={deleteDiagnosticVideoAction.bind(null, v.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Excluir
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
