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
// `enablejsapi=1` é obrigatório para o player aceitar comandos/eventos via
// postMessage (usado em lesson-item.tsx para medir quanto do vídeo foi
// realmente assistido, em vez de confiar num botão manual "já assisti", e
// também pra tocar/pausar/avançar via os controles próprios — ver abaixo).
//
// Os outros parâmetros (pedido do Telles: tirar as "chamadas" do YouTube de
// cima do vídeo — cards de "mais vídeos", ícone de compartilhar, etc.):
// - `rel=0`: ao pausar/terminar, só sugere vídeos do mesmo canal (não
//   qualquer vídeo do YouTube).
// - `modestbranding=1`: reduz a marca do YouTube na barra de controle.
// - `iv_load_policy=3`: desliga anotações/cards do vídeo — é isso que fazia
//   aparecer o balão "Mais vídeos" (sugestão de outro vídeo) por cima da
//   gravação durante a reprodução.
// - `controls=0`: desliga os controles nativos do YouTube por completo —
//   é o único jeito de tirar também o ícone de compartilhar, o de "assistir
//   depois" e o botão "Assista no YouTube", que vêm junto com a barra de
//   controle nativa e não têm um parâmetro próprio pra serem escondidos
//   individualmente. Como isso também tira o play/pause e a barra de
//   progresso nativos, o `lesson-item.tsx` (única tela que usa este embed)
//   constrói os próprios controles (play/pause, progresso, volume) usando a
//   IFrame API do YouTube — ver `YouTubeGatedPlayer` lá.
function withJsApi(embedUrl: string): string {
  try {
    const u = new URL(embedUrl);
    u.searchParams.set("enablejsapi", "1");
    u.searchParams.set("rel", "0");
    u.searchParams.set("modestbranding", "1");
    u.searchParams.set("iv_load_policy", "3");
    u.searchParams.set("controls", "0");
    return u.toString();
  } catch {
    return embedUrl;
  }
}

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
    return id ? withJsApi(`https://www.youtube.com/embed/${id}`) : url;
  }

  if (host === "youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? withJsApi(`https://www.youtube.com/embed/${id}`) : url;
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const id = parsed.pathname.split("/")[2];
      return id ? withJsApi(`https://www.youtube.com/embed/${id}`) : url;
    }
    // já é /embed/... (ou outra rota do youtube) — garante enablejsapi também
    return withJsApi(url);
  }

  return url;
}

/** true quando a URL de embed é do YouTube (onde temos a IFrame API para medir o quanto foi assistido). */
export function isYouTubeEmbed(embedUrl: string): boolean {
  try {
    return new URL(embedUrl).hostname.replace(/^www\./, "") === "youtube.com";
  } catch {
    return false;
  }
}
