import { marked } from "marked";

/**
 * O texto das matérias é escrito no painel em Markdown simples
 * (## título, **negrito**, - lista, [link](url)). HTML cru é escapado.
 */
export function renderMarkdown(src: string | null | undefined) {
  const safe = (src ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // devolve citações "> texto" que o escape acima quebrou
  const withQuotes = safe.replace(/^&gt; ?/gm, "> ");
  return marked.parse(withQuotes, { async: false, gfm: true, breaks: true }) as string;
}

export function stripMarkdown(src: string | null | undefined) {
  return (src ?? "")
    .replace(/[#*_>`\[\]]/g, "")
    .replace(/\(https?:[^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
