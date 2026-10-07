import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { initials, PostCard } from "@/components/site/Cards";
import { db } from "@/lib/db";

type Params = Promise<{ slug: string }>;
const PER_PAGE = 12;

const load = (slug: string) => db.author.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = await load((await params).slug);
  return a ? { title: `${a.name} — colunista`, description: a.bio?.slice(0, 160) ?? undefined } : {};
}

export default async function AuthorPage({ params, searchParams }: { params: Params; searchParams: Promise<{ pagina?: string }> }) {
  const a = await load((await params).slug);
  if (!a) notFound();
  const page = Math.max(1, Number((await searchParams).pagina) || 1);
  const where = { published: true, authorId: a.id, publishedAt: { lte: new Date() } };
  const [total, articles, answers] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({ where, include: { section: true }, orderBy: { publishedAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.question.findMany({ where: { published: true, authorId: a.id }, orderBy: { answeredAt: "desc" }, take: 5 }),
  ]);
  const pages = Math.ceil(total / PER_PAGE);
  const links = [
    a.website && { href: a.website, icon: "globe", label: "Site" },
    a.instagram && { href: a.instagram, icon: "instagram", label: "Instagram" },
    a.linkedin && { href: a.linkedin, icon: "linkedin", label: "LinkedIn" },
  ].filter(Boolean) as { href: string; icon: string; label: string }[];

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <Link href="/colunistas">Colunistas</Link> / <span>{a.name}</span>
          </nav>
          <div className="profile__head">
            <span className="avatar avatar--lg">{a.photo ? <img src={a.photo} alt={a.name} /> : initials(a.name)}</span>
            <div>
              <h1 style={{ fontSize: "clamp(28px,4.2vw,48px)" }}>{a.name}</h1>
              {a.role && <p style={{ marginTop: 6 }}>{a.role}</p>}
              {links.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener" className="chip chip--glass">
                      <Icon name={l.icon} size={13} /> {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="section section--first">
        <div className="container">
          {a.bio && (
            <div className="card" style={{ marginBottom: 32 }}>
              <p style={{ color: "var(--ink-2)", whiteSpace: "pre-line" }}>{a.bio}</p>
            </div>
          )}
          {articles.length > 0 && (
            <>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>
                Matérias ({total})
              </h2>
              <div className="post-grid">
                {articles.map((x) => (
                  <PostCard key={x.id} a={x} />
                ))}
              </div>
              {pages > 1 && (
                <nav className="pills" style={{ justifyContent: "center", marginTop: 32 }} aria-label="Páginas">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <Link key={n} href={`/colunistas/${a.slug}${n > 1 ? `?pagina=${n}` : ""}`} aria-current={n === page}>
                      {n}
                    </Link>
                  ))}
                </nav>
              )}
            </>
          )}
          {answers.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h2 style={{ fontSize: 24, marginBottom: 10 }}>Respostas no Tira-Dúvidas</h2>
              {answers.map((q) => (
                <Link key={q.id} href={`/tira-duvidas/${q.slug}`} className="qa-item">
                  <span className="qa-item__mark">?</span>
                  <div>
                    <h3>{q.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
