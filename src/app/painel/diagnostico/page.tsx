import { requireUser } from "@/lib/auth";
import { listDiagnosticEntries } from "@/lib/diagnostic-videos";
import { toPlainEmbedUrl } from "@/lib/video";
import VideoLibrary from "./video-library";

export default async function PainelDiagnosticoPage() {
  await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);
  const { entries: videos } = await listDiagnosticEntries({ onlyPublished: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Diagnóstico</h1>
        <p className="text-sm text-gray-500">
          Vídeos de consulta técnica da trilha “Vídeos de Diagnóstico”. Sem prova e sem
          certificado — é só assistir quando precisar.
        </p>
      </div>
      <VideoLibrary
        videos={videos.map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          topic: v.topic,
          embedUrl: toPlainEmbedUrl(v.videoUrl),
        }))}
      />
    </div>
  );
}
