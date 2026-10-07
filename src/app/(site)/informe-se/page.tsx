import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/site/Cards";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Informe-se: notícias e artigos para síndicos",
  description: "Jurídico, manutenção, finanças, segurança e convivência em condomínios.",
};

const PER_PAGE = 12;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ secao?: string; q?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const sections = await db.articleSection.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  const current = sections.find((s) => s.slug === sp.secao);
  const q = sp.q?.trim() ?? "";
  const where: Prisma.ArticleWhereInput = {
    published: true,
    publishedAt: { lte: new Date() },
    ...(current ? { sectionId: current.id } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [total, articles] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({ where, include: { section: true }, orderBy: { publishedAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
  ]);
  const pages = Math.ceil(total / PER_PAGE);
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ secao: sp.secao, q, ...patch })) if (v) p.set(k, v);
    return `/informe-se${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Informe-se</span>
          </nav>
          <h1>
            {current ? current.name : "Informe-se"} <span className="serif">{current ? "" : "sobre o seu condomínio."}</span>
          </h1>
          <p>Artigos de especialistas e notícias do mercado condominial.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <form className="filters" action="/informe-se" role="search">
            <div className="filters__search">
              <Icon name="search" />
              <label htmlFor="n-q" className="sr-only">
                Buscar matéria
              </label>
              <input id="n-q" name="q" className="input" placeholder="Buscar matéria" defaultValue={q} />
            </div>
            {sp.secao && <input type="hidden" name="secao" value={sp.secao} />}
            <button className="btn">Buscar</button>
          </form>
          <div className="pills">
            <Link href={link({ secao: undefined, pagina: undefined })} aria-current={!current}>
              Todas
            </Link>
            {sections.map((s) => (
              <Link key={s.id} href={link({ secao: s.slug, pagina: undefined })} aria-current={current?.id === s.id}>
                {s.name}
              </Link>
            ))}
          </div>
          {articles.length > 0 ? (
            <div className="post-grid">
              {articles.map((a, i) => (
                <PostCard key={a.id} a={a} delay={(i % 3) * 0.05} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="newspaper" size={28} />
              <strong>Nenhuma matéria encontrada.</strong>
            </div>
          )}
          {pages > 1 && (
            <nav className="pills" style={{ justifyContent: "center", marginTop: 40 }} aria-label="Páginas">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={link({ pagina: String(n) })} aria-current={n === page}>
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
