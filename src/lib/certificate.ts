import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

// Cor institucional aproximada (extraída da logo oficial — hex exato ainda A CONFIRMAR)
const BRAND = rgb(0 / 255, 47 / 255, 135 / 255);

export interface CertificateData {
  code: string;
  userName: string;
  trainingTitle: string;
  workloadHours: number | null;
  scorePercent: number | null;
  issuedAtLabel: string;
  validationUrl: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 paisagem
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // moldura
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: BRAND,
    borderWidth: 3,
  });

  page.drawText("BMC | HYUNDAI", {
    x: 50,
    y: height - 70,
    size: 20,
    font: fontBold,
    color: BRAND,
  });
  page.drawText("BMC Academy — Treinamento Técnico e Comercial", {
    x: 50,
    y: height - 90,
    size: 10,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  page.drawText("CERTIFICADO DE CONCLUSÃO", {
    x: width / 2 - 160,
    y: height - 160,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText("Certificamos que", {
    x: width / 2 - 60,
    y: height - 220,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(data.userName, {
    x: width / 2 - fontBold.widthOfTextAtSize(data.userName, 24) / 2,
    y: height - 250,
    size: 24,
    font: fontBold,
    color: BRAND,
  });

  const conclusionLine = `concluiu o treinamento "${data.trainingTitle}"`;
  page.drawText(conclusionLine, {
    x: width / 2 - font.widthOfTextAtSize(conclusionLine, 13) / 2,
    y: height - 285,
    size: 13,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const details = [
    data.workloadHours ? `Carga horária: ${data.workloadHours}h` : null,
    data.scorePercent !== null ? `Nota: ${data.scorePercent.toFixed(0)}%` : null,
    `Conclusão: ${data.issuedAtLabel}`,
  ]
    .filter(Boolean)
    .join("     •     ");

  page.drawText(details, {
    x: width / 2 - font.widthOfTextAtSize(details, 11) / 2,
    y: height - 315,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Código de validação: ${data.code}`, {
    x: 50,
    y: 70,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText("Documento gerado automaticamente pela BMC Academy (protótipo).", {
    x: 50,
    y: 55,
    size: 8,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });

  // QR code de validação
  const qrDataUrl = await QRCode.toDataURL(data.validationUrl, { margin: 1, width: 200 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrImageBytes);
  const qrSize = 90;
  page.drawImage(qrImage, {
    x: width - qrSize - 60,
    y: 45,
    width: qrSize,
    height: qrSize,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Guarda o PDF do certificado no BANCO (base64), não no disco — funções
 * serverless da Vercel rodam com sistema de arquivos somente leitura, então
 * gravar em `public/certificates` (como uma versão anterior fazia) quebrava
 * a emissão do certificado em produção com um erro. O caminho retornado é
 * uma URL que a rota `/certificados/arquivo/[code]` serve dinamicamente,
 * lendo o PDF de volta do banco.
 */
export function certificatePdfUrl(code: string): string {
  return `/certificados/arquivo/${code}.pdf`;
}

export function generateCertificateCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BMC-${y}-${rand}`;
}
