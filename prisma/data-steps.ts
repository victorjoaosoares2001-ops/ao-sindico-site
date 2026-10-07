/**
 * Etapas de dados executadas a cada deploy, logo após `prisma db push`.
 * Cada etapa roda UMA vez por banco (tabela DataImport) — conteúdo apagado
 * pela equipe nunca volta.
 *   npm run db:steps
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ARTICLES, CAMPAIGNS, CATEGORIES, EVENTS, SECTIONS, SUPPLIERS } from "./seed-content";
import { cleanMigratedText, excerptFrom } from "./text-fix";
import { migrateLegacyImages as migrateImagesWith } from "./legacy-images";
import { siteUrl } from "../src/lib/site-url";

const db = new PrismaClient();

const slugify = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function step(name: string, fn: () => Promise<string | void>) {
  if (await db.dataImport.findUnique({ where: { name } })) return;
  const msg = await fn();
  await db.dataImport.create({ data: { name } });
  console.log(`✔ ${name}${msg ? ` — ${msg}` : ""}`);
}

async function json<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await readFile(new URL(`./acervo/${file}.json`, import.meta.url), "utf8"));
  } catch {
    return [];
  }
}

async function ensureSection(name: string) {
  const slug = slugify(name);
  const pretty = name === "Noticias" ? "Notícias" : name;
  return db.articleSection.upsert({ where: { slug }, update: {}, create: { name: pretty, slug, order: 50 } });
}

async function ensureCategory(name: string) {
  const slug = slugify(name);
  return db.category.upsert({ where: { slug }, update: {}, create: { name, slug, order: 50 } });
}

async function ensureAuthor(name: string, extra: { slug?: string | null; bio?: string | null; photo?: string | null } = {}) {
  const slug = extra.slug ? slugify(extra.slug) : slugify(name);
  const found = await db.author.findFirst({ where: { OR: [{ slug }, { name }] } });
  if (found) return found;
  return db.author.create({ data: { name, slug, bio: extra.bio ?? null, photo: extra.photo ?? null } });
}

const excerptOf = (md: string) => {
  const text = md.replace(/[#*>\[\]_`-]/g, "").replace(/\(https?:[^)]+\)/g, "").replace(/\s+/g, " ").trim();
  return text.length > 190 ? `${text.slice(0, 187).replace(/\s+\S*$/, "")}…` : text;
};

const migrateLegacyImages = () => migrateImagesWith(db);

async function main() {
  // 1) Segurança: a tela pública de "primeiro acesso" ficou exposta antes do provisionamento.
  //    Nenhum acesso legítimo existia; qualquer conta criada nesse período é removida.
  await step("seguranca-remover-contas-nao-provisionadas-2026-10", async () => {
    const users = await db.adminUser.findMany({ select: { id: true, createdAt: true } });
    await db.adminUser.deleteMany({});
    return users.length ? `${users.length} conta(s) removida(s), criadas em: ${users.map((u) => u.createdAt.toISOString()).join(", ")}` : "nenhuma conta existia";
  });

  // 2) Conteúdo inicial (banco novo)
  await step("conteudo-inicial", async () => {
    if ((await db.category.count()) > 0) return "banco já tinha conteúdo";
    for (const [i, c] of CATEGORIES.entries()) await db.category.create({ data: { ...c, slug: slugify(c.name), order: i } });
    for (const [i, name] of SECTIONS.entries()) await db.articleSection.create({ data: { name, slug: slugify(name), order: i } });
    for (const [i, s] of SUPPLIERS.entries()) {
      const { categories, ...data } = s;
      await db.supplier.create({ data: { ...data, slug: slugify(s.name), order: i, categories: { connect: categories.map((n) => ({ slug: slugify(n) })) } } });
    }
    for (const a of ARTICLES) {
      const { section, date, ...data } = a;
      await db.article.create({ data: { ...data, slug: slugify(a.title), publishedAt: new Date(date), section: { connect: { slug: slugify(section) } } } });
    }
    for (const e of EVENTS) await db.event.create({ data: { ...e, slug: slugify(e.title), startsAt: new Date(e.startsAt) } });
    for (const c of CAMPAIGNS) await db.campaign.create({ data: c });
  });

  // 3) Acervo migrado do site atual (prisma/acervo/*.json)
  await step("acervo-fornecedores-v1", async () => {
    const items = await json<{ url: string; name: string; logo: string | null; categories: string[]; services: string[]; description: string | null; email?: string; phone?: string }>("fornecedores");
    let created = 0;
    for (const s of items) {
      const slug = slugify(s.url.split("/fornecedor/")[1] ?? s.name);
      const cats = await Promise.all(s.categories.map(ensureCategory));
      const exists = await db.supplier.findFirst({ where: { OR: [{ slug }, { name: { equals: s.name, mode: "insensitive" } }] } });
      const data = {
        logo: s.logo,
        description: s.description,
        services: s.services.join(", ") || null,
        email: s.email ?? null,
        phone: s.phone ?? null,
      };
      if (exists) {
        await db.supplier.update({
          where: { id: exists.id },
          data: {
            logo: exists.logo ?? data.logo,
            description: exists.description ?? data.description,
            services: exists.services ?? data.services,
            categories: { connect: cats.map((c) => ({ id: c.id })) },
          },
        });
        continue;
      }
      await db.supplier.create({ data: { name: s.name, slug, ...data, order: 100 + created, categories: { connect: cats.map((c) => ({ id: c.id })) } } });
      created++;
    }
    return `${created} novos de ${items.length}`;
  });

  await step("acervo-sindicos-v1", async () => {
    const items = await json<{ url: string; name: string; logo: string | null; description: string | null }>("sindicos");
    const cat = await db.category.upsert({
      where: { slug: "sindico-profissional" },
      update: {},
      create: { name: "Síndico Profissional", slug: "sindico-profissional", icon: "users", order: 90 },
    });
    let created = 0;
    for (const s of items) {
      const slug = slugify(s.url.split("/sindico-profissional/")[1] ?? s.name);
      if (await db.supplier.findFirst({ where: { OR: [{ slug }, { name: { equals: s.name, mode: "insensitive" } }] } })) continue;
      await db.supplier.create({
        data: { name: s.name, slug, cover: null, logo: s.logo, description: s.description, tagline: "Síndico(a) profissional", order: 500 + created, categories: { connect: { id: cat.id } } },
      });
      created++;
    }
    return `${created} perfis`;
  });

  await step("acervo-tira-duvidas-v1", async () => {
    const items = await json<{ title: string; slug: string; body: string | null; answer: string | null; date: string | null }>("duvidas");
    const team = await ensureAuthor("Portal Ao Síndico", { slug: "portal-ao-sindico" });
    let n = 0;
    for (const q of items) {
      const slug = slugify(q.slug || q.title);
      if (await db.question.findUnique({ where: { slug } })) continue;
      const when = q.date ? new Date(q.date) : new Date();
      await db.question.create({
        data: {
          title: q.title,
          slug,
          body: q.body,
          answer: q.answer,
          askerName: "Leitor do portal",
          status: q.answer ? "publicada" : "pendente",
          published: !!q.answer,
          authorId: q.answer ? team.id : null,
          answeredAt: q.answer ? when : null,
          createdAt: when,
        },
      });
      n++;
    }
    return `${n} perguntas`;
  });

  await step("acervo-materias-v1", async () => {
    type A = { slug: string; title: string; cover: string | null; date: string; sections: string[]; views: number; author: string | null; authorSlug: string | null; authorBio: string | null; authorPhoto: string | null; content: string };
    const items = await json<A>("artigos");
    let created = 0;
    let updated = 0;
    for (const a of items) {
      if (!a.title || !a.content) continue;
      const slug = slugify(a.slug || a.title);
      const section = a.sections[0] ? await ensureSection(a.sections[0]) : null;
      // o slug do colunista no JSON antigo vinha do menu do site: a identidade é o nome
      const author = a.author ? await ensureAuthor(a.author, { bio: a.authorBio, photo: a.authorPhoto }) : null;
      const publishedAt = Number.isNaN(Date.parse(a.date)) ? new Date() : new Date(a.date);
      const data = {
        title: a.title,
        content: a.content,
        excerpt: excerptOf(a.content),
        cover: a.cover,
        views: a.views,
        publishedAt,
        sectionId: section?.id ?? null,
        authorId: author?.id ?? null,
      };
      const exists = await db.article.findUnique({ where: { slug } });
      if (exists) {
        // matérias do conteúdo inicial eram resumos: troca pelo texto original
        await db.article.update({ where: { id: exists.id }, data: { content: a.content, cover: exists.cover ?? a.cover, views: a.views, authorId: exists.authorId ?? data.authorId } });
        updated++;
      } else {
        await db.article.create({ data: { ...data, slug } });
        created++;
      }
    }
    return `${created} novas, ${updated} atualizadas, de ${items.length}`;
  });

  // 4) Autores: liga matérias antigas (autor em texto) a perfis de colunista
  await step("autores-v1", async () => {
    const loose = await db.article.findMany({ where: { authorId: null, author: { not: null } }, select: { id: true, author: true, authorBio: true } });
    for (const a of loose) {
      const au = await ensureAuthor(a.author!, { bio: a.authorBio });
      await db.article.update({ where: { id: a.id }, data: { authorId: au.id } });
    }
    return `${loose.length} matérias ligadas`;
  });

  // 5) Anúncios: prioridade passou a ser "maior primeiro"
  await step("anuncios-prioridade-v1", async () => {
    const list = await db.campaign.findMany({ select: { id: true, order: true } });
    // ordem antiga (1 = primeiro) vira prioridade baixa (9, 8…): anúncios novos do comercial passam na frente
    for (const c of list) await db.campaign.update({ where: { id: c.id }, data: { order: Math.max(0, 10 - c.order) } });
  });

  // 6) Textos migrados: espaços/parágrafos perdidos e título repetido no início.
  //    Só altera matérias que continuam idênticas ao que foi importado (não toca no que a equipe editou).
  await step("acervo-texto-v2", async () => {
    const items = await json<{ slug: string; title: string; content: string }>("artigos");
    let fixed = 0;
    for (const a of items) {
      const row = await db.article.findUnique({ where: { slug: slugify(a.slug || a.title) }, select: { id: true, title: true, content: true } });
      if (!row || row.content !== a.content) continue;
      const content = cleanMigratedText(row.title, a.content);
      await db.article.update({ where: { id: row.id }, data: { content, excerpt: excerptFrom(content) } });
      fixed++;
    }
    // resumos gerados que começam repetindo o título
    const all = await db.article.findMany({ select: { id: true, title: true, excerpt: true, content: true } });
    let excerpts = 0;
    for (const a of all) {
      const t = a.title.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, " ").trim();
      const e = (a.excerpt ?? "").toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, " ").trim();
      if (a.content && t && e.startsWith(t)) {
        await db.article.update({ where: { id: a.id }, data: { excerpt: excerptFrom(cleanMigratedText(a.title, a.content)) } });
        excerpts++;
      }
    }
    return `${fixed} textos limpos, ${excerpts} resumos refeitos`;
  });

  // 7) Avaliações públicas do portal antigo
  await step("acervo-avaliacoes-v1", async () => {
    const items = await json<{ profileSlug: string; profileName: string; author: string | null; rating: number; comment: string | null; date: string | null }>("avaliacoes");
    let n = 0;
    for (const r of items) {
      const supplier = await db.supplier.findFirst({
        where: { OR: [{ slug: slugify(r.profileSlug) }, { name: { equals: r.profileName, mode: "insensitive" } }] },
        select: { id: true },
      });
      if (!supplier) continue;
      await db.review.create({
        data: {
          supplierId: supplier.id,
          name: r.author || "Avaliação do portal anterior",
          rating: r.rating,
          comment: r.comment,
          status: "aprovada",
          createdAt: r.date ? new Date(r.date) : undefined,
        },
      });
      n++;
    }
    return `${n} de ${items.length}`;
  });

  // 8) Imagens hospedadas no site antigo → armazenamento do projeto (Vercel Blob em produção).
  //    Repete a cada deploy até não sobrar nenhuma referência ao servidor antigo.
  await migrateLegacyImages();

  // 9) Acesso da dona: enquanto não houver dono ativo, gera um convite de uso único.
  //    O link sai SOMENTE no log deste build (visível apenas para quem administra a hospedagem).
  const owners = await db.adminUser.count({ where: { role: "dono", active: true } });
  if (owners === 0) {
    await db.adminToken.updateMany({ where: { kind: "convite", role: "dono", usedAt: null }, data: { expiresAt: new Date() } });
    const token = randomBytes(32).toString("base64url");
    await db.adminToken.create({
      data: {
        tokenHash: createHash("sha256").update(token).digest("hex"),
        kind: "convite",
        email: (process.env.OWNER_EMAIL || "").toLowerCase(),
        role: "dono",
        createdBy: "Provisionamento (deploy)",
        expiresAt: new Date(Date.now() + 72 * 3600_000),
      },
    });
    const base = siteUrl();
    console.log(`[CONVITE-DONA] ${base}/admin/convite/${token}`);
    console.log("  (uso único, válido por 72 horas; gerado porque ainda não existe dona/dono ativo)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
