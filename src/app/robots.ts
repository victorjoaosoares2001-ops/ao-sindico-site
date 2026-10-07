import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // URLs de pré-visualização da Vercel não devem ser indexadas
  if (!isIndexable()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/anuncio/", "/busca"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
