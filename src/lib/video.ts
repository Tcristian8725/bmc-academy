/**
 * Converte um link comum do YouTube (o que aparece no botão "Compartilhar",
 * ex: https://www.youtube.com/watch?v=XXXX ou https://youtu.be/XXXX) para o
 * formato de "embed" que o player dentro da plataforma precisa
 * (https://www.youtube.com/embed/XXXX).
 *
 * Sem essa conversão, colar o link comum do YouTube faz o navegador recusar
 * a conexão ao tentar exibir o vídeo dentro da página (o YouTube bloqueia a
 * página normal de ser exibida dentro de um iframe — só a URL de embed é
 * liberada para isso).
 *
 * Links que não são do YouTube (Vimeo, etc.) ou que já estão no formato de
 * embed passam direto, sem alteração.
 */
export function toEmbedUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  if (host === "youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const id = parsed.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    return url;
  }

  return url;
}
