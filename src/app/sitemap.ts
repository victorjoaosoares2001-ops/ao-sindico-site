import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const [suppliers, articles, events, courses] = await Promise.all([
    db.supplier.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.course.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const fixed = ["", "/fornecedores", "/informe-se", "/eventos", "/cursos", "/parceiros", "/orcamento", "/anuncie"].map((p) => ({
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
  ];
}
