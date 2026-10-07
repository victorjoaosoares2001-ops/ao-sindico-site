import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { NewsletterForm } from "@/components/site/Forms";
import { db } from "@/lib/db";
import { formatDate, readingTime } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { activeCampaigns } from "@/lib/queries";

type Params = Promise<{ slug: string }>;

function load(slug: string) {
  return db.article.findFirst({ where: { slug, published: true }, include: { section: true } });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = await load((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt ?? undefined,
    openGraph: { type: "article", images: a.cover ? [a.cover] : undefined, publishedTime: a.publishedAt.toISOString() },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const a = await load((await params).slug);
  if (!a) notFound();

  const [latest, ads] = await Promise.all([
    db.article.findMany({
      where: { published: true, id: { not: a.id }, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { slug: true, title: true, publishedAt: true },
    }),
    activeCampaigns("materia", 2),
  ]);
  // contador simples de leituras
  db.article.update({ where: { id: a.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    datePublished: a.publishedAt.toISOString(),
    author: a.author ? { "@type": "Person", name: a.author } : undefined,
    image: a.cover ?? undefined,
    publisher: { "@type": "Organization", name: "Ao Síndico" },
  };

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: a.cover ? "clamp(72px,9vw,110px)" : undefined }}>
        <div className="container">
          <div className="article-hero">
            <nav className="crumbs" aria-label="Você está em">
              <Link href="/">Início</Link> / <Link href="/informe-se">Informe-se</Link>
              {a.section && (
                <>
                  {" "}
                  / <Link href={`/informe-se?secao=${a.section.slug}`}>{a.section.name}</Link>
                </>
              )}
            </nav>
            <h1 style={{ fontSize: "clamp(32px,4.8vw,58px)" }}>{a.title}</h1>
            {a.excerpt && <p>{a.excerpt}</p>}
            <div className="meta" style={{ marginTop: 22, color: "rgba(255,255,255,.6)" }}>
              {a.section && <b style={{ color: "var(--yellow)" }}>{a.section.name}</b>}
              {a.author && <span>Por {a.author}</span>}
              <span>{formatDate(a.publishedAt)}</span>
              <span>{readingTime(a.content)} min de leitura</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {a.cover && (
          <div className="article-cover">
            <img src={a.cover} alt="" />
          </div>
        )}
      </div>

      <section className="section">
        <div className="container article-layout">
          <article>
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.content) }} />
            {a.author && (
              <div className="author-card">
                <span className="meta" style={{ margin: 0 }}>
                  <b>Colunista</b>
                </span>
                <strong>{a.author}</strong>
                {a.authorBio && <p>{a.authorBio}</p>}
              </div>
            )}
          </article>
          <aside className="sticky-aside" style={{ display: "grid", gap: 24 }}>
            {ads.map((ad) =>
              ad.image ? (
                <a key={ad.id} href={ad.link ?? "#"} target="_blank" rel="noopener sponsored" style={{ display: "block", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                  <img src={ad.image} alt={ad.title} loading="lazy" />
                </a>
              ) : null,
            )}
            <div>
              <h3 style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Leia também</h3>
              <div className="side-list">
                {latest.map((l) => (
                  <Link key={l.slug} href={`/informe-se/${l.slug}`}>
                    {l.title}
                    <small>{formatDate(l.publishedAt)}</small>
                  </Link>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 18, marginBottom: 6 }}>Novidades no seu e-mail</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 14 }}>Sem spam. Só o que importa para o seu condomínio.</p>
              <NewsletterForm />
            </div>
            <Link href="/orcamento" className="btn btn--magenta btn--arrow">
              Precisa de um fornecedor?
              <span className="btn__dot">
                <Icon name="arrowUpRight" size={16} />
              </span>
            </Link>
          </aside>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
