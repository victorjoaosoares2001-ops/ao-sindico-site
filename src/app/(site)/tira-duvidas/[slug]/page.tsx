import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { initials } from "@/components/site/Cards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";

type Params = Promise<{ slug: string }>;

const load = (slug: string) => db.question.findFirst({ where: { slug, published: true }, include: { author: true, section: true } });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const q = await load((await params).slug);
  return q ? { title: q.title, description: q.answer?.replace(/[#*>]/g, "").slice(0, 160) } : {};
}

export default async function QuestionPage({ params }: { params: Params }) {
  const q = await load((await params).slug);
  if (!q) notFound();
  const related = await db.question.findMany({
    where: { published: true, id: { not: q.id }, ...(q.sectionId ? { sectionId: q.sectionId } : {}) },
    orderBy: { answeredAt: "desc" },
    take: 5,
  });
  db.question.update({ where: { id: q.id }, data: { views: { increment: 1 } } }).catch(() => {});
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: q.title,
      text: q.body ?? q.title,
      answerCount: q.answer ? 1 : 0,
      acceptedAnswer: q.answer ? { "@type": "Answer", text: q.answer } : undefined,
    },
  };

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container article-hero">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <Link href="/tira-duvidas">Tira-Dúvidas</Link>
            {q.section && (
              <>
                {" "}
                / <Link href={`/tira-duvidas?assunto=${q.section.slug}`}>{q.section.name}</Link>
              </>
            )}
          </nav>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)" }}>{q.title}</h1>
          <p>
            Pergunta de {q.askerName}
            {q.askerCity ? `, ${q.askerCity}` : ""} · {formatDate(q.createdAt)}
          </p>
        </div>
      </section>
      <section className="section section--first">
        <div className="container article-layout">
          <article>
            {q.body && <p style={{ fontSize: 18, color: "var(--ink-2)", whiteSpace: "pre-line" }}>{q.body}</p>}
            <div className="answer-box">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span className="avatar" style={{ width: 44, height: 44 }}>
                  {q.author?.photo ? <img src={q.author.photo} alt="" /> : initials(q.author?.name ?? "Ao Síndico")}
                </span>
                <div>
                  <strong>Resposta {q.author ? `de ${q.author.name}` : "da equipe"}</strong>
                  <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{q.author?.role ?? (q.answeredAt ? formatDate(q.answeredAt) : "")}</div>
                </div>
              </div>
              <div className="prose" style={{ fontSize: 17 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(q.answer) }} />
              {q.author && (
                <Link href={`/colunistas/${q.author.slug}`} className="link-arrow" style={{ marginTop: 16 }}>
                  Ver perfil e matérias <Icon name="arrowUpRight" size={15} />
                </Link>
              )}
            </div>
            <p style={{ marginTop: 22, fontSize: 13, color: "var(--ink-3)" }}>
              As respostas têm caráter informativo e não substituem orientação jurídica individual.
            </p>
          </article>
          <aside className="sticky-aside" style={{ display: "grid", gap: 20 }}>
            <Link href="/tira-duvidas#perguntar" className="btn btn--arrow">
              Enviar minha pergunta
              <span className="btn__dot">
                <Icon name="arrowUpRight" size={16} />
              </span>
            </Link>
            {related.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Outras dúvidas</h3>
                <div className="side-list">
                  {related.map((r) => (
                    <Link key={r.id} href={`/tira-duvidas/${r.slug}`}>
                      {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
