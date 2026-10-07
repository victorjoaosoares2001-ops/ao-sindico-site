/**
 * Migra o acervo público do site atual (aosindico.com) para prisma/acervo/*.json.
 * Uma requisição por vez, com pausa, identificando-se como migração.
 *   node scripts/importar-acervo.mjs [artigos|fornecedores|sindicos|duvidas|todos]
 * Os JSON gerados são carregados no banco por prisma/data-steps.ts (uma única vez).
 */
import { load } from "cheerio";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const BASE = "https://aosindico.com";
const OUT = new URL("../prisma/acervo/", import.meta.url);
const HEADERS = { "user-agent": "Mozilla/5.0 (migracao Ao Sindico)" };
const PAUSE = 700;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(PAUSE * attempt);
    const res = await fetch(path.startsWith("http") ? path : BASE + path, { headers: HEADERS });
    if (res.ok) return load(await res.text());
    console.warn(`  ${res.status} em ${path} (tentativa ${attempt})`);
  }
  return null;
}

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const slugify = (t) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const abs = (src) => (!src ? null : src.startsWith("http") ? src : BASE + (src.startsWith("/") ? "" : "/") + src);
const MONTHS = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

/** HTML do editor antigo → Markdown simples usado no novo painel. */
function toMarkdown($, root) {
  const inline = (node) => {
    let out = "";
    $(node)
      .contents()
      .each((_, el) => {
        if (el.type === "text") out += el.data.replace(/\s+/g, " ");
        else if (el.type === "tag") {
          const tag = el.tagName.toLowerCase();
          const inner = inline(el);
          if (tag === "br") out += "\n";
          else if ((tag === "b" || tag === "strong") && inner.trim()) out += ` **${inner.trim()}** `;
          else if ((tag === "i" || tag === "em") && inner.trim()) out += ` *${inner.trim()}* `;
          else if (tag === "a" && $(el).attr("href") && inner.trim() && /^https?:/.test($(el).attr("href")))
            out += `[${inner.trim()}](${$(el).attr("href")})`;
          else out += inner;
        }
      });
    return out;
  };
  const blocks = [];
  $(root)
    .children()
    .each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      if (!tag || ["script", "style", "img", "ul.blog-info-link"].includes(tag)) return;
      if ($(el).hasClass("blog-info-link") || $(el).is("h1")) return;
      if (/^h[2-6]$/.test(tag)) blocks.push(`## ${clean($(el).text())}`);
      else if (tag === "ul" || tag === "ol")
        blocks.push(
          $(el)
            .children("li")
            .map((_, li) => `- ${clean(inline(li))}`)
            .get()
            .join("\n"),
        );
      else if (tag === "blockquote") blocks.push(`> ${clean(inline(el))}`);
      else {
        const txt = inline(el)
          .split("\n")
          .map((l) => l.replace(/\s+/g, " ").replace(/\*\*\s*\*\*/g, "").trim())
          .join("\n")
          .trim();
        if (txt) blocks.push(txt.replace(/ \*\*([.,;:])/g, "**$1"));
      }
    });
  return blocks
    .filter((b) => !/^(LEIA|VEJA) TAMB[ÉE]M/i.test(b))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function save(name, data) {
  await mkdir(OUT, { recursive: true });
  await writeFile(new URL(`${name}.json`, OUT), JSON.stringify(data, null, 1));
  console.log(`✔ ${name}.json: ${data.length} itens`);
}

async function loadExisting(name) {
  try {
    return JSON.parse(await readFile(new URL(`${name}.json`, OUT), "utf8"));
  } catch {
    return [];
  }
}

// ---------- Matérias + colunistas ----------

async function artigos() {
  const $first = await get("/informe-se");
  const last = Math.max(1, ...$first("a[href*='informe-se?page=']").map((_, a) => +($first(a).attr("href").match(/page=(\d+)/)?.[1] ?? 1)).get());
  const links = new Set();
  for (let p = 1; p <= last; p++) {
    const $ = p === 1 ? $first : await get(`/informe-se?page=${p}`);
    $?.("a[href*='/informe/']").each((_, a) => links.add($(a).attr("href").split("?")[0]));
    process.stdout.write(`\r  listas ${p}/${last} · ${links.size} matérias`);
  }
  console.log();

  const done = await loadExisting("artigos");
  const have = new Map(done.map((a) => [a.url, a]));
  const out = [];
  let i = 0;
  for (const url of links) {
    i++;
    if (have.has(url)) {
      out.push(have.get(url));
      continue;
    }
    const $ = await get(url);
    if (!$) continue;
    const d = $(".blog_details").first();
    const title = clean(d.find("h1").first().text());
    if (!title) continue;
    const day = clean($(".blog_item_date h3").first().text());
    const [mon, year] = clean($(".blog_item_date p").first().text()).split("|").map((s) => s.trim().toLowerCase());
    const month = MONTHS[mon?.slice(0, 3)] ?? 1;
    const sections = d.find(".blog-info-link a[href*='/informe-se/']").map((_, a) => clean($(a).text())).get();
    const views = +(clean(d.find(".blog-info-link").text()).match(/(\d+)\s*visualiza/)?.[1] ?? 0);
    // só o bloco do autor no fim da matéria (o menu do site também tem links de colunistas)
    const authorLink = $(".blog-author a[href*='/colunista/']").first();
    const authorBox = $(".blog-author").first();
    out.push({
      url,
      slug: url.split("/informe/")[1],
      title,
      cover: abs($(".blog_item_img img").first().attr("src")),
      date: `${year}-${String(month).padStart(2, "0")}-${String(day || 1).padStart(2, "0")}T10:00:00-03:00`,
      sections,
      views,
      author: clean(authorBox.find("h4").first().text()) || clean(authorLink.text()) || null,
      authorSlug: authorLink.attr("href")?.split("/colunista/")[1] ?? null,
      authorBio: clean(authorBox.find("p").first().text()) || null,
      authorPhoto: abs(authorBox.find("img").first().attr("src")),
      content: toMarkdown($, d),
    });
    process.stdout.write(`\r  matérias ${i}/${links.size}`);
    if (i % 25 === 0) await save("artigos", out);
  }
  console.log();
  await save("artigos", out);
}

// ---------- Fornecedores ----------

async function listagem(path, linkPart) {
  const $first = await get(path);
  const last = Math.max(1, ...$first(`a[href*='page=']`).map((_, a) => +($first(a).attr("href").match(/page=(\d+)/)?.[1] ?? 1)).get());
  const items = [];
  for (let p = 1; p <= last; p++) {
    const $ = p === 1 ? $first : await get(`${path}?page=${p}`);
    $?.(".single-job-items").each((_, el) => {
      const box = $(el);
      const link = box.find(`a[href*='${linkPart}']`).first().attr("href");
      const name = clean(box.find("h4").first().text());
      if (!link || !name) return;
      items.push({
        url: link,
        name,
        logo: abs(box.find(".company-img img").first().attr("src")),
        categories: box.find("a[href*='/fornecedores/']").map((_, a) => clean($(a).text())).get(),
        services: box.find("a.testimonial-bg").map((_, a) => clean($(a).text())).get(),
        description: clean(box.find(".w-100 p").first().text()) || null,
      });
    });
    process.stdout.write(`\r  ${path} ${p}/${last} · ${items.length}`);
  }
  console.log();
  return items;
}

async function fornecedores() {
  const items = await listagem("/fornecedores", "/fornecedor/");
  for (const [i, s] of items.entries()) {
    const $ = await get(s.url);
    if (!$) continue;
    const box = $(".job-tittle").first();
    const desc = clean(box.find(".w-100.text-justify").text());
    if (desc && desc.length > (s.description?.length ?? 0)) s.description = desc;
    const email = clean(box.find("a[href^='mailto:']").first().text());
    const phone = clean(box.find(".mb-0 span").first().text()).replace(/\s+/g, " ");
    // o site antigo mostra o contato da própria Ao Síndico em vários perfis: não importar
    if (email && !/aosindico\.com/i.test(email)) s.email = email;
    if (phone && !/4978-? ?1200/.test(phone)) s.phone = phone;
    if (!s.services.length)
      s.services = $(".generic-blockquote strong").map((_, x) => clean($(x).text())).get();
    process.stdout.write(`\r  detalhes ${i + 1}/${items.length}`);
  }
  console.log();
  await save("fornecedores", items);
}

async function sindicos() {
  const items = await listagem("/sindico-profissional", "/sindico-profissional/");
  await save("sindicos", items);
}

// ---------- Tira-Dúvidas ----------

async function duvidas() {
  const $list = await get("/tiraduvidas");
  const links = [...new Set($list("a[href*='/tiraduvidas/']").map((_, a) => $list(a).attr("href")).get())].filter((h) => /tiraduvidas\/\d+\//.test(h));
  const out = [];
  for (const url of links) {
    const $ = await get(url);
    if (!$) continue;
    const title = clean($("h1").first().text());
    const body = clean($(".blog_right_sidebar p").filter((_, p) => !$(p).closest("#reviews, #review-form, .comment-list").length && !$(p).hasClass("date")).first().text());
    const asked = clean($(".single-comment .date").first().text());
    const answers = $("ul.reviews > li .review-body p").map((_, p) => clean($(p).text())).get().filter(Boolean);
    const [d, m, y] = asked.split(" ")[0]?.split("/") ?? [];
    out.push({
      url,
      title,
      slug: slugify(title),
      body: body || null,
      answer: answers.join("\n\n") || null,
      date: y ? `${y}-${m}-${d}T12:00:00-03:00` : null,
    });
  }
  await save("duvidas", out);
}

const what = process.argv[2] ?? "todos";
if (what === "fornecedores" || what === "todos") await fornecedores();
if (what === "sindicos" || what === "todos") await sindicos();
if (what === "duvidas" || what === "todos") await duvidas();
if (what === "artigos" || what === "todos") await artigos();
