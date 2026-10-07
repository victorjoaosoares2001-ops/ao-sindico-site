/**
 * Importa as avaliações públicas do site antigo para prisma/acervo/avaliacoes.json.
 * Só abre o perfil de quem tem avaliação na listagem. Uma requisição por vez, com pausa.
 *   node scripts/importar-avaliacoes.mjs
 */
import { load } from "cheerio";
import { writeFile } from "node:fs/promises";

const BASE = "https://aosindico.com";
const HEADERS = { "user-agent": "Mozilla/5.0 (migracao Ao Sindico)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

async function get(path) {
  for (let i = 1; i <= 3; i++) {
    await sleep(700 * i);
    const res = await fetch(path.startsWith("http") ? path : BASE + path, { headers: HEADERS });
    if (res.ok) return load(await res.text());
  }
  return null;
}

async function withReviews(path, linkPart) {
  const $first = await get(path);
  const last = Math.max(1, ...$first(`a[href*='page=']`).map((_, a) => +($first(a).attr("href").match(/page=(\d+)/)?.[1] ?? 1)).get());
  const out = [];
  for (let p = 1; p <= last; p++) {
    const $ = p === 1 ? $first : await get(`${path}?page=${p}`);
    $?.(".single-job-items").each((_, el) => {
      const box = $(el);
      const link = box.find(`a[href*='${linkPart}']`).first().attr("href");
      const count = +(clean(box.find(".stars").text()).match(/\|\s*(\d+)/)?.[1] ?? 0);
      if (link && count > 0) out.push({ url: link, name: clean(box.find("h4").first().text()), count });
    });
  }
  return out;
}

const targets = [...(await withReviews("/fornecedores", "/fornecedor/")), ...(await withReviews("/sindico-profissional", "/sindico-profissional/"))];
console.log(`${targets.length} perfis com avaliação`);

const reviews = [];
for (const t of targets) {
  const $ = await get(t.url);
  if (!$) continue;
  $("ul.reviews > li").each((_, li) => {
    const item = $(li);
    const comment = clean(item.find(".review-body").text());
    const date = clean(item.find(".date").first().text()); // 05/01/2023 18:45
    if (!comment && !date) return;
    const stars = item.find(".review-rating i.fa-star");
    const checked = stars.filter((_, s) => /checked|active|filled/.test($(s).attr("class") ?? "")).length;
    const empty = stars.filter((_, s) => /fa-star-o|empty|unchecked/.test($(s).attr("class") ?? "")).length;
    const rating = Math.min(5, Math.max(1, checked || stars.length - empty || 5));
    const [d, m, rest] = date.split("/");
    const [y, time] = (rest ?? "").split(" ");
    reviews.push({
      profileUrl: t.url,
      profileSlug: decodeURIComponent(t.url.split("/").pop()),
      profileName: t.name,
      author: clean(item.find(".name").first().text()) || null,
      rating,
      comment: comment || null,
      date: y ? `${y}-${m}-${d}T${time || "12:00"}:00-03:00` : null,
    });
  });
}
await writeFile(new URL("../prisma/acervo/avaliacoes.json", import.meta.url), JSON.stringify(reviews, null, 1));
console.log(`✔ avaliacoes.json: ${reviews.length} avaliações`);
