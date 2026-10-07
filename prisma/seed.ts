/**
 * Popula o banco com o conteúdo do site atual e cria o primeiro acesso ao painel.
 * Pode ser executado de novo: não duplica registros existentes (usa o slug).
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ARTICLES, CAMPAIGNS, CATEGORIES, EVENTS, SECTIONS, SUPPLIERS } from "./seed-content";

const db = new PrismaClient();

const slugify = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

async function main() {
  // Primeiro acesso: pelo .env (ADMIN_PASSWORD) ou, sem ele, pela tela "Criar primeiro acesso" em /admin.
  const email = (process.env.ADMIN_EMAIL || "admin@aosindico.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (password && !(await db.adminUser.findUnique({ where: { email } }))) {
    await db.adminUser.create({ data: { name: "Equipe Ao Síndico", email, passwordHash: await bcrypt.hash(password, 10) } });
    console.log(`✔ acesso ao painel criado: ${email}`);
  }

  // Conteúdo inicial só entra em banco vazio: o seed roda a cada deploy e não pode
  // recriar o que a equipe apagou pelo painel.
  if ((await db.category.count()) > 0) {
    console.log("✔ banco já tem conteúdo — seed de conteúdo ignorado");
    return;
  }

  for (const [i, c] of CATEGORIES.entries()) {
    const slug = slugify(c.name);
    await db.category.upsert({ where: { slug }, update: {}, create: { ...c, slug, order: i } });
  }
  for (const [i, name] of SECTIONS.entries()) {
    const slug = slugify(name);
    await db.articleSection.upsert({ where: { slug }, update: {}, create: { name, slug, order: i } });
  }

  for (const [i, s] of SUPPLIERS.entries()) {
    const slug = slugify(s.name);
    const { categories, ...data } = s;
    await db.supplier.upsert({
      where: { slug },
      update: {},
      create: {
        ...data,
        slug,
        order: i,
        categories: { connect: categories.map((n) => ({ slug: slugify(n) })) },
      },
    });
  }

  for (const a of ARTICLES) {
    const slug = slugify(a.title);
    const { section, date, ...data } = a;
    await db.article.upsert({
      where: { slug },
      update: {},
      create: { ...data, slug, publishedAt: new Date(date), section: { connect: { slug: slugify(section) } } },
    });
  }

  for (const e of EVENTS) {
    const slug = slugify(e.title);
    await db.event.upsert({ where: { slug }, update: {}, create: { ...e, slug, startsAt: new Date(e.startsAt) } });
  }

  if ((await db.campaign.count()) === 0) {
    for (const c of CAMPAIGNS) await db.campaign.create({ data: c });
  }

  console.log("✔ conteúdo inicial carregado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
