import { cache } from "react";
import { db } from "./db";

export const supplierCardInclude = { categories: { select: { name: true, slug: true } } } as const;

export const PRO_SLUG = "sindico-profissional";

/** Anúncios no ar para uma posição (datas + status), por prioridade. */
export function activeCampaigns(placement: string, take = 6) {
  const now = new Date();
  return db.campaign.findMany({
    where: {
      published: true,
      placement,
      image: { not: null },
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ order: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Link rastreado do anúncio (conta o clique e redireciona). */
export const adHref = (id: string) => `/anuncio/${id}`;

export const publishedCategories = cache(() =>
  db.category.findMany({ where: { published: true, slug: { not: PRO_SLUG } }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
);

export async function upcomingEvents(take = 3) {
  const now = new Date();
  const next = await db.event.findMany({ where: { published: true, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take });
  if (next.length >= take) return next;
  const past = await db.event.findMany({
    where: { published: true, OR: [{ startsAt: { lt: now } }, { startsAt: null }] },
    orderBy: { startsAt: "desc" },
    take: take - next.length,
  });
  return [...next, ...past];
}

export function upcomingCourses(take = 3) {
  return db.course.findMany({ where: { published: true }, orderBy: [{ startsAt: "desc" }], take });
}

/** Números reais do portal (nada inventado). */
export const portalNumbers = cache(async () => {
  const [suppliers, pros, articles, questions, events] = await Promise.all([
    db.supplier.count({ where: { published: true, categories: { none: { slug: PRO_SLUG } } } }),
    db.supplier.count({ where: { published: true, categories: { some: { slug: PRO_SLUG } } } }),
    db.article.count({ where: { published: true, publishedAt: { lte: new Date() } } }),
    db.question.count({ where: { published: true } }),
    db.event.count({ where: { published: true } }),
  ]);
  return { suppliers, pros, articles, questions, events };
});

/** Média e quantidade de avaliações aprovadas por fornecedor. */
export async function ratings(ids: string[]) {
  if (!ids.length) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({ by: ["supplierId"], where: { supplierId: { in: ids }, status: "aprovada" }, _avg: { rating: true }, _count: true });
  return new Map(rows.map((r) => [r.supplierId, { avg: r._avg.rating ?? 0, count: r._count }]));
}

export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

/** Busca global: fornecedores, matérias, Tira-Dúvidas, eventos, cursos e vídeos. */
export async function globalSearch(q: string, take = 8) {
  const c = { contains: q, mode: "insensitive" as const };
  const [suppliers, articles, questions, events, courses, videos] = await Promise.all([
    db.supplier.findMany({
      where: { published: true, OR: [{ name: c }, { services: c }, { tagline: c }, { description: c }, { city: c }, { categories: { some: { name: c } } }] },
      include: supplierCardInclude,
      orderBy: [{ featured: "desc" }, { plan: "desc" }, { name: "asc" }],
      take,
    }),
    db.article.findMany({
      where: { published: true, publishedAt: { lte: new Date() }, OR: [{ title: c }, { excerpt: c }, { content: c }] },
      include: { section: true, authorRef: true },
      orderBy: { publishedAt: "desc" },
      take,
    }),
    db.question.findMany({ where: { published: true, OR: [{ title: c }, { body: c }, { answer: c }] }, orderBy: { createdAt: "desc" }, take }),
    db.event.findMany({ where: { published: true, OR: [{ title: c }, { excerpt: c }, { city: c }] }, orderBy: { startsAt: "desc" }, take: 4 }),
    db.course.findMany({ where: { published: true, OR: [{ title: c }, { excerpt: c }] }, orderBy: { startsAt: "desc" }, take: 4 }),
    db.video.findMany({ where: { published: true, OR: [{ title: c }, { description: c }] }, orderBy: { publishedAt: "desc" }, take: 4 }),
  ]);
  return { suppliers, articles, questions, events, courses, videos };
}
