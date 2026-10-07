/**
 * Limpeza dos textos migrados do site antigo (editor com <font>/<b> aninhados):
 * espaços perdidos, negrito colado, pontuação solta, parágrafos gigantes e
 * título repetido no início do texto.
 */

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const WORD = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/;

/** Garante espaço do lado de fora de cada par **negrito** quando colado em palavras. */
function fixBold(line: string) {
  const parts = line.split("**");
  if (parts.length < 2) return line;
  // marcadores sem par (negrito quebrado no original): remove, mantendo as palavras separadas
  if ((parts.length - 1) % 2 === 1) return parts.join(" ").replace(/ {2,}/g, " ");
  let out = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const opening = i % 2 === 1;
    const prev = out.slice(-1);
    const next = parts[i].slice(0, 1);
    if (opening && WORD.test(prev)) out += " ";
    out += "**";
    if (!opening && WORD.test(next)) out += " ";
    // conteúdo do negrito sem espaços nas bordas
    out += opening ? parts[i].replace(/^\s+/, "").replace(/\s+$/, "") : parts[i];
  }
  return out;
}

/** Quebra parágrafos muito longos em blocos de ~3 frases. */
function splitLong(block: string) {
  if (block.length < 900 || /^(#|-|>|\d+\.)/.test(block) || block.includes("\n")) return [block];
  // corta só em "fim de frase + espaço + maiúscula": nunca descarta texto (ex.: "Lei 8.245/1991")
  const sentences = block.split(/(?<=[.!?])\s+(?=["“(]?[A-ZÀ-Ý])/);
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    cur = cur ? `${cur} ${s}` : s;
    if (cur.length > 380) {
      out.push(cur.trim());
      cur = "";
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function cleanMigratedText(title: string, content: string) {
  let blocks = content
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  // 1º bloco igual ao título (às vezes em negrito) → remove
  if (blocks.length > 1 && norm(blocks[0].replace(/\*/g, "")) === norm(title)) blocks = blocks.slice(1);

  blocks = blocks.map((b) =>
    b
      .split("\n")
      .map((line) =>
        fixBold(line)
          // "roubo.Segundo" → "roubo. Segundo" (fora de links)
          .replace(/([a-zà-ÿ]{2}[.!?;:])([A-ZÀ-Ý][a-zà-ÿ])/g, "$1 $2")
          // "parede,alterar" → "parede, alterar" (não mexe em URLs codificadas)
          .replace(/([a-zà-ÿ]{2}),([a-zà-ÿ]{3})/g, (m, a, b, off, str) => (/%[0-9A-F]{2}/i.test(str.slice(Math.max(0, off - 12), off + 12)) ? m : `${a}, ${b}`))
          // "vítima** ," → "vítima**,"
          .replace(/\s+([,.;:!?)])/g, "$1")
          .replace(/\(\s+/g, "(")
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\*\*\s*\*\*/g, "")
          .trim(),
      )
      .filter(Boolean)
      .join("\n"),
  );

  return blocks.flatMap(splitLong).filter(Boolean).join("\n\n");
}

export function excerptFrom(md: string) {
  const text = md
    .replace(/[#*>_`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^- /gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 190 ? `${text.slice(0, 187).replace(/\s+\S*$/, "")}…` : text;
}
