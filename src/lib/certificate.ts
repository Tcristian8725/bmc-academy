import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import {
  CERT_BACKGROUND_JPG_BASE64,
  CERT_LOGO_PNG_BASE64,
  CERT_SAB_BADGE_JPG_BASE64,
} from "./certificate-assets";

// Paleta extraída do modelo oficial de certificado BMC | Hyundai (arquivo de
// referência "Certificado_Amarildo_Silva_de_Souza.pdf", enviado pelo Telles em
// 16/09/2026) — mesmo azul-marinho e dourado da marca usados no papel timbrado
// real da empresa para certificados de treinamento presencial.
const NAVY_DARK = rgb(6 / 255, 20 / 255, 48 / 255);
const NAVY = rgb(9 / 255, 33 / 255, 78 / 255);
const GOLD = rgb(191 / 255, 149 / 255, 63 / 255);

export interface CertificateData {
  code: string;
  userName: string;
  trainingTitle: string;
  workloadHours: number | null;
  scorePercent: number | null;
  issuedAtLabel: string;
  validationUrl: string;
}

/**
 * Gera o PDF do certificado seguindo o modelo oficial BMC | Hyundai (fundo
 * fotográfico de equipamentos, moldura dourada/azul-marinho, logo e selo SAB)
 * — modelo definido a partir de um certificado real enviado pelo Telles.
 * Diferente do modelo de referência (certificado de participação em evento
 * presencial, com assinatura do instrutor), este é emitido automaticamente
 * pelo sistema quando o técnico/RC é APROVADO numa prova, então:
 * - o título continua "CERTIFICADO DE CONCLUSÃO" (mais preciso que
 *   "participação", já que exige aprovação);
 * - não há assinatura de instrutor (a pedido do Telles — o modelo original
 *   tinha a assinatura do Carlos Alberto Holanda Alves Junior, mas a emissão
 *   é automática, sem um instrutor específico por trás de cada certificado);
 * - a nota obtida e o código de validação com QR code (recursos que o
 *   sistema já tinha antes desta mudança de layout) foram mantidos, num
 *   cartão de validação no canto inferior direito para garantir legibilidade
 *   sobre a foto de fundo.
 */
export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const width = 960;
  const height = 640;
  const page = doc.addPage([width, height]);

  const bgImage = await doc.embedJpg(Buffer.from(CERT_BACKGROUND_JPG_BASE64, "base64"));
  page.drawImage(bgImage, { x: 0, y: 0, width, height });

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const MAX_TEXT_WIDTH = width - 140; // margem segura para não invadir a moldura

  const centerText = (
    text: string,
    y: number,
    size: number,
    f = font,
    color = rgb(0.3, 0.3, 0.3)
  ) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color });
    return w;
  };

  // Como nome do técnico/título do treinamento variam bastante, reduz o
  // tamanho da fonte automaticamente até caber dentro da largura segura, em
  // vez de deixar o texto vazar por cima da moldura dourada.
  const centerTextFit = (
    text: string,
    y: number,
    startSize: number,
    f = font,
    color = rgb(0.3, 0.3, 0.3),
    minSize = 10
  ) => {
    let size = startSize;
    while (size > minSize && f.widthOfTextAtSize(text, size) > MAX_TEXT_WIDTH) {
      size -= 1;
    }
    return centerText(text, y, size, f, color);
  };

  // Logo BMC | HYUNDAI
  const logoImage = await doc.embedPng(Buffer.from(CERT_LOGO_PNG_BASE64, "base64"));
  const logoDims = logoImage.scale(1);
  const logoW = 230;
  const logoH = (logoW / logoDims.width) * logoDims.height;
  page.drawImage(logoImage, {
    x: (width - logoW) / 2,
    y: height - 95,
    width: logoW,
    height: logoH,
  });

  // Título + sublinhado dourado
  centerText("CERTIFICADO DE CONCLUSÃO", height - 165, 28, fontBold, NAVY_DARK);
  page.drawLine({
    start: { x: (width - 220) / 2, y: height - 178 },
    end: { x: (width + 220) / 2, y: height - 178 },
    thickness: 2,
    color: GOLD,
  });

  centerText("Certificamos que", height - 215, 13, font, rgb(0.25, 0.25, 0.25));

  // Nome do participante + sublinhado
  const nameW = centerTextFit(data.userName, height - 260, 26, fontBold, NAVY_DARK, 14);
  page.drawLine({
    start: { x: (width - nameW) / 2 - 10, y: height - 270 },
    end: { x: (width + nameW) / 2 + 10, y: height - 270 },
    thickness: 1,
    color: NAVY,
  });

  // Corpo — treinamento, aproveitamento e carga horária
  centerTextFit(`concluiu o treinamento "${data.trainingTitle}"`, height - 300, 14, font, rgb(0.2, 0.2, 0.2), 9);
  const detailParts = [
    data.scorePercent !== null ? `com aproveitamento de ${data.scorePercent.toFixed(0)}%` : null,
    data.workloadHours ? `carga horária total de ${data.workloadHours}h` : null,
  ].filter(Boolean);
  if (detailParts.length > 0) {
    centerTextFit(
      `promovido pela BMC Academy, ${detailParts.join(" e ")}.`,
      height - 322,
      14,
      font,
      rgb(0.2, 0.2, 0.2),
      9
    );
  }

  centerText(`Emitido em ${data.issuedAtLabel}`, height - 358, 12, fontItalic, rgb(0.3, 0.3, 0.3));

  // Selo SAB | BMC Hyundai
  const badgeImage = await doc.embedJpg(Buffer.from(CERT_SAB_BADGE_JPG_BASE64, "base64"));
  const badgeDims = badgeImage.scale(1);
  const badgeW = 88;
  const badgeH = (badgeW / badgeDims.width) * badgeDims.height;
  page.drawImage(badgeImage, { x: (width - badgeW) / 2, y: 62, width: badgeW, height: badgeH });

  // Cartão de validação (QR + código) — fundo branco translúcido para ficar
  // legível independente da foto de fundo por trás.
  const qrDataUrl = await QRCode.toDataURL(data.validationUrl, { margin: 0, width: 200 });
  const qrImage = await doc.embedPng(Buffer.from(qrDataUrl.split(",")[1], "base64"));
  const qrSize = 58;
  const cardW = 250;
  const cardH = 78;
  const cardX = width - cardW - 46;
  const cardY = 40;

  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: rgb(1, 1, 1),
    opacity: 0.82,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });
  page.drawImage(qrImage, {
    x: cardX + 10,
    y: cardY + (cardH - qrSize) / 2,
    width: qrSize,
    height: qrSize,
  });
  const textX = cardX + qrSize + 20;
  page.drawText("Código de validação:", {
    x: textX,
    y: cardY + cardH - 22,
    size: 8.5,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  page.drawText(data.code, {
    x: textX,
    y: cardY + cardH - 34,
    size: 9.5,
    font: fontBold,
    color: NAVY_DARK,
  });
  page.drawText("Documento gerado", { x: textX, y: cardY + cardH - 50, size: 7.5, font, color: rgb(0.45, 0.45, 0.45) });
  page.drawText("automaticamente pela", { x: textX, y: cardY + cardH - 60, size: 7.5, font, color: rgb(0.45, 0.45, 0.45) });
  page.drawText("BMC Academy.", { x: textX, y: cardY + cardH - 70, size: 7.5, font, color: rgb(0.45, 0.45, 0.45) });

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
