import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { certificates, trainings } from "@/db/schema";

export default async function CertificadosPage() {
  const session = await requireUser(["TECNICO", "RC", "FUNCIONARIO"]);

  const rows = await db
    .select({
      id: certificates.id,
      code: certificates.code,
      issuedAt: certificates.issuedAt,
      scorePercent: certificates.scorePercent,
      pdfPath: certificates.pdfPath,
      trainingTitle: trainings.title,
    })
    .from(certificates)
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(eq(certificates.userId, session.userId!));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Meus certificados</h1>

      <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {rows.length === 0 && (
          <p className="p-6 text-sm text-gray-500">Nenhum certificado emitido ainda.</p>
        )}
        {rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-foreground">{c.trainingTitle}</p>
              <p className="text-xs text-gray-500">
                Código {c.code} • Nota {c.scorePercent?.toFixed(0)}% • Emitido em{" "}
                {new Date(c.issuedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {c.pdfPath && (
              <a
                href={c.pdfPath}
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                Baixar PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
