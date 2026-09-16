/**
 * Rota de diagnóstico temporária (protegida pelo SETUP_TOKEN) para investigar
 * o erro "SOI not found in JPEG" que só acontece em produção (não reproduz
 * localmente com o mesmo build) — verifica se os bytes das imagens
 * embutidas em base64 chegam corretos no ambiente de execução da Vercel,
 * sem passar pelo pdf-lib, para isolar se o problema é no dado ou na lib.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  CERT_BACKGROUND_JPG_BASE64,
  CERT_LOGO_PNG_BASE64,
  CERT_SAB_BADGE_JPG_BASE64,
} from "@/lib/certificate-assets";

export const dynamic = "force-dynamic";

function inspect(name: string, base64: string) {
  const bytes = Buffer.from(base64, "base64");
  return {
    name,
    base64Length: base64.length,
    decodedByteLength: bytes.length,
    firstBytesHex: bytes.subarray(0, 12).toString("hex"),
    lastBytesHex: bytes.subarray(-8).toString("hex"),
    base64Prefix: base64.slice(0, 20),
    base64Suffix: base64.slice(-20),
  };
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: "Token inválido." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    runtime: process.version,
    background: inspect("background", CERT_BACKGROUND_JPG_BASE64),
    logo: inspect("logo", CERT_LOGO_PNG_BASE64),
    badge: inspect("badge", CERT_SAB_BADGE_JPG_BASE64),
  });
}
