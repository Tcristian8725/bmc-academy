import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, trainings, users } from "@/db/schema";

export default async function ValidateCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [row] = await db
    .select({
      code: certificates.code,
      issuedAt: certificates.issuedAt,
      scorePercent: certificates.scorePercent,
      workloadHours: certificates.workloadHours,
      trainingTitle: trainings.title,
      userName: users.name,
    })
    .from(certificates)
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .innerJoin(users, eq(certificates.userId, users.id))
    .where(eq(certificates.code, code));

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3">
          <span className="text-lg font-extrabold tracking-tight text-white">
            BMC <span className="mx-1 font-light">|</span> HYUNDAI
          </span>
        </div>

        {!row ? (
          <>
            <h1 className="text-lg font-semibold text-red-600">Certificado não encontrado</h1>
            <p className="mt-2 text-sm text-gray-500">
              O código <span className="font-mono">{code}</span> não corresponde a nenhum
              certificado emitido pela BMC Academy.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-emerald-700">Certificado válido ✓</h1>
            <div className="mt-4 space-y-1 text-left text-sm text-gray-700">
              <p>
                <span className="text-gray-500">Participante:</span>{" "}
                <strong>{row.userName}</strong>
              </p>
              <p>
                <span className="text-gray-500">Treinamento:</span> {row.trainingTitle}
              </p>
              {row.workloadHours && (
                <p>
                  <span className="text-gray-500">Carga horária:</span> {row.workloadHours}h
                </p>
              )}
              {row.scorePercent !== null && (
                <p>
                  <span className="text-gray-500">Nota:</span> {row.scorePercent?.toFixed(0)}%
                </p>
              )}
              <p>
                <span className="text-gray-500">Emitido em:</span>{" "}
                {new Date(row.issuedAt).toLocaleDateString("pt-BR")}
              </p>
              <p>
                <span className="text-gray-500">Código:</span>{" "}
                <span className="font-mono">{row.code}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
