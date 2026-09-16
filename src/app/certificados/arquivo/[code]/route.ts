/**
 * Serve o PDF do certificado direto do banco (coluna `pdfData`, base64) —
 * não existe arquivo no disco. Ver nota em src/lib/certificate.ts sobre por
 * que o certificado não pode ser gravado em arquivo em produção (Vercel).
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.replace(/\.pdf$/i, "");

  const [cert] = await db.select().from(certificates).where(eq(certificates.code, code));

  if (!cert || !cert.pdfData) {
    return new NextResponse("Certificado não encontrado.", { status: 404 });
  }

  const bytes = Buffer.from(cert.pdfData, "base64");
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${code}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
