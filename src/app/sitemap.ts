import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { isAvailable, sectionAvailability } from "@/lib/sections";
import { isIndexable, siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexable()) return [];
  const base = siteUrl();
  const open = await sectionAvailability();
  const [suppliers, articles, events, courses, authors, questions] = await Promise.all([
    db.supplier.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    db.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.course.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.author.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.question.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const fixed = ["", "/fornecedores", "/sindicos-profissionais", "/informe-se", "/tira-duvidas", "/colunistas", "/videos", "/eventos", "/cursos", "/parceiros", "/orcamento", "/anuncie", "/contato", "/privacidade", "/termos"].filter((p) => isAvailable(open, p)).map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...fixed,
    ...suppliers.map((s) => ({ url: `${base}/fornecedores/${s.slug}`, lastModified: s.updatedAt })),
    ...articles.map((a) => ({ url: `${base}/informe-se/${a.slug}`, lastModified: a.updatedAt })),
    ...events.map((e) => ({ url: `${base}/eventos/${e.slug}`, lastModified: e.updatedAt })),
    ...courses.map((c) => ({ url: `${base}/cursos/${c.slug}`, lastModified: c.updatedAt })),
    ...authors.map((a) => ({ url: `${base}/colunistas/${a.slug}`, lastModified: a.updatedAt })),
    ...questions.map((q) => ({ url: `${base}/tira-duvidas/${q.slug}`, lastModified: q.updatedAt })),
  ];
}
