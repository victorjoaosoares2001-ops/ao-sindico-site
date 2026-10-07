import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/site/Cards";
import { db } from "@/lib/db";
import { activeCampaigns, adHref } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Informe-se: notícias e artigos para síndicos",
  description: "Jurídico, manutenção, finanças, segurança e convivência em condomínios. Acervo com centenas de matérias.",
};

const PER_PAGE = 12;

type SP = Promise<{ secao?: string; q?: string; pagina?: string; ano?: string; autor?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const [sections, years, authors] = await Promise.all([
    db.articleSection.findMany({ where: { articles: { some: { published: true } } }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    db.$queryRaw<{ y: number; n: bigint }[]>`SELECT EXTRACT(YEAR FROM "publishedAt")::int AS y, COUNT(*) AS n FROM "Article" WHERE published = true AND "publishedAt" <= NOW() GROUP BY 1 ORDER BY 1 DESC`,
    db.author.findMany({ where: { published: true, articles: { some: { published: true } } }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);
  const current = sections.find((s) => s.slug === sp.secao);
  const author = authors.find((a) => a.slug === sp.autor);
  const year = Number(sp.ano) || null;
  const q = sp.q?.trim() ?? "";
  const now = new Date();
  const where: Prisma.ArticleWhereInput = {
    published: true,
    publishedAt: year ? { gte: new Date(`${year}-01-01T00:00:00-03:00`), lt: new Date(`${year + 1}-01-01T00:00:00-03:00`), lte: now } : { lte: now },
    ...(current ? { sectionId: current.id } : {}),
    ...(author ? { authorId: author.id } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [total, articles, popular, ads] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({ where, include: { section: true, authorRef: true }, orderBy: { publishedAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.article.findMany({ where: { published: true, publishedAt: { lte: now } }, orderBy: { views: "desc" }, take: 5, select: { slug: true, title: true, views: true } }),
    activeCampaigns("materia", 1),
  ]);
  const pages = Math.ceil(total / PER_PAGE);
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ secao: sp.secao, q, ano: sp.ano, autor: sp.autor, ...patch })) if (v) p.set(k, v);
    return `/informe-se${p.size ? `?${p}` : ""}`;
  };
  // paginação compacta: 1 … 4 5 6 … 30
  const pageList = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Informe-se</span>
          </nav>
          <h1>
            {current ? current.name : author ? author.name : "Informe-se"} <span className="serif">{current || author ? "" : "sobre o seu condomínio."}</span>
          </h1>
          <p>{year ? `Matérias de ${year}.` : "Artigos de especialistas e notícias do mercado condominial."}</p>
        </div>
      </section>
      <section className="section section--first">
        <div className="container">
          <form className="filters" action="/informe-se" role="search" style={{ marginTop: 0 }}>
            <div className="filters__search">
              <Icon name="search" />
              <input name="q" className="input" placeholder="Buscar matéria" defaultValue={q} aria-label="Buscar matéria" />
            </div>
            <select name="ano" className="select" defaultValue={sp.ano ?? ""} aria-label="Ano">
              <option value="">Todos os anos</option>
              {years.map((y) => (
                <option key={y.y} value={y.y}>
                  {y.y} ({Number(y.n)})
                </option>
              ))}
            </select>
            <select name="autor" className="select" defaultValue={sp.autor ?? ""} aria-label="Colunista">
              <option value="">Todos os colunistas</option>
              {authors.map((a) => (
                <option key={a.id} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
            {sp.secao && <input type="hidden" name="secao" value={sp.secao} />}
            <button className="btn">Filtrar</button>
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
          <div className="with-aside">
            <div>
              <p className="result-count">
                {total} {total === 1 ? "matéria" : "matérias"}
              </p>
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
                  <Link href="/informe-se" className="btn btn--ghost">
                    Limpar filtros
                  </Link>
                </div>
              )}
              {pages > 1 && (
                <nav className="pills" style={{ justifyContent: "center", marginTop: 40 }} aria-label="Páginas">
                  {page > 1 && <Link href={link({ pagina: String(page - 1) })}>← Anterior</Link>}
                  {pageList.map((n, i) => (
                    <span key={n} style={{ display: "contents" }}>
                      {i > 0 && n - pageList[i - 1] > 1 && <span style={{ alignSelf: "center", color: "var(--ink-3)" }}>…</span>}
                      <Link href={link({ pagina: String(n) })} aria-current={n === page}>
                        {n}
                      </Link>
                    </span>
                  ))}
                  {page < pages && <Link href={link({ pagina: String(page + 1) })}>Próxima →</Link>}
                </nav>
              )}
            </div>
            <aside className="sticky-aside" style={{ display: "grid", gap: 18 }}>
              <div className="aside-box">
                <h3>Mais lidas</h3>
                <div className="side-list">
                  {popular.map((p) => (
                    <Link key={p.slug} href={`/informe-se/${p.slug}`}>
                      {p.title}
                      <small>{p.views.toLocaleString("pt-BR")} leituras</small>
                    </Link>
                  ))}
                </div>
              </div>
              {ads[0]?.image && (
                <a href={ads[0].link ? adHref(ads[0].id) : "#"} className="aside-ad" target="_blank" rel="noopener sponsored">
                  <img src={ads[0].image} alt={ads[0].title} loading="lazy" />
                </a>
              )}
              <div className="aside-box">
                <h3>Colunistas</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {authors.slice(0, 12).map((a) => (
                    <Link key={a.id} href={`/colunistas/${a.slug}`} className="chip">
                      {a.name}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
