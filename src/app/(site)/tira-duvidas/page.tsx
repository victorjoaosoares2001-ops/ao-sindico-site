import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { QuestionForm } from "@/components/site/Forms";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { activeCampaigns, adHref } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Tira-Dúvidas: perguntas sobre condomínio",
  description: "Dúvidas de síndicos e moradores respondidas por especialistas: convivência, obras, assembleia, locação e mais.",
};

const PER_PAGE = 15;

export default async function QAPage({ searchParams }: { searchParams: Promise<{ q?: string; assunto?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  const sections = await db.articleSection.findMany({ where: { questions: { some: { published: true } } }, orderBy: { name: "asc" } });
  const allSections = await db.articleSection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const current = sections.find((s) => s.slug === sp.assunto);
  const where: Prisma.QuestionWhereInput = {
    published: true,
    ...(current ? { sectionId: current.id } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }, { answer: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [total, items, ads] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({ where, include: { author: true, section: true }, orderBy: [{ answeredAt: "desc" }, { createdAt: "desc" }], take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    activeCampaigns("lateral", 1),
  ]);
  const pages = Math.ceil(total / PER_PAGE);
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, assunto: sp.assunto, ...patch })) if (v) p.set(k, v);
    return `/tira-duvidas${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container page-hero__row">
          <div>
            <nav className="crumbs" aria-label="Você está em">
              <Link href="/">Início</Link> / <span>Tira-Dúvidas</span>
            </nav>
            <h1>
              Tira-Dúvidas <span className="serif">do condomínio.</span>
            </h1>
            <p>Perguntas de síndicos e moradores respondidas por especialistas.</p>
          </div>
          <a href="#perguntar" className="btn btn--yellow btn--arrow">
            Enviar minha pergunta
            <span className="btn__dot">
              <Icon name="arrowRight" size={16} />
            </span>
          </a>
        </div>
      </section>

      <section className="section section--first">
        <div className="container with-aside">
          <div>
            <form className="filters" action="/tira-duvidas" role="search" style={{ marginTop: 0, position: "static" }}>
              <div className="filters__search">
                <Icon name="search" />
                <input name="q" className="input" placeholder="Buscar dúvida" defaultValue={q} aria-label="Buscar dúvida" />
              </div>
              {sp.assunto && <input type="hidden" name="assunto" value={sp.assunto} />}
              <button className="btn">Buscar</button>
            </form>
            {sections.length > 0 && (
              <div className="pills">
                <Link href={link({ assunto: undefined, pagina: undefined })} aria-current={!current}>
                  Todas
                </Link>
                {sections.map((s) => (
                  <Link key={s.id} href={link({ assunto: s.slug, pagina: undefined })} aria-current={current?.id === s.id}>
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
            <p className="result-count">
              {total} {total === 1 ? "pergunta respondida" : "perguntas respondidas"}
            </p>
            {items.map((it) => (
              <Link key={it.id} href={`/tira-duvidas/${it.slug}`} className="qa-item">
                <span className="qa-item__mark">?</span>
                <div>
                  <div className="meta" style={{ margin: "0 0 4px" }}>
                    {it.section && <b>{it.section.name}</b>}
                    <span>{formatDate(it.answeredAt ?? it.createdAt)}</span>
                    {it.author && <span>· respondida por {it.author.name}</span>}
                  </div>
                  <h3>{it.title}</h3>
                  {it.answer && <p>{it.answer.replace(/[#*>]/g, "")}</p>}
                </div>
              </Link>
            ))}
            {items.length === 0 && (
              <div className="empty">
                <Icon name="quote" size={28} />
                <strong>Nenhuma dúvida encontrada.</strong>
                <p>Envie a sua: nossos especialistas respondem.</p>
              </div>
            )}
            {pages > 1 && (
              <nav className="pills" style={{ justifyContent: "center", marginTop: 32 }} aria-label="Páginas">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={link({ pagina: String(n) })} aria-current={n === page}>
                    {n}
                  </Link>
                ))}
              </nav>
            )}

            <div id="perguntar" className="card" style={{ marginTop: 40, scrollMarginTop: 110 }}>
              <h2 style={{ fontSize: 24 }}>Envie sua pergunta</h2>
              <p style={{ color: "var(--ink-3)", margin: "-6px 0 20px", fontSize: 15 }}>Ela é publicada com a resposta de um especialista.</p>
              <QuestionForm sections={allSections} />
            </div>
          </div>
          <aside className="sticky-aside" style={{ display: "grid", gap: 18 }}>
            <div className="aside-box">
              <h3>Precisa de um fornecedor?</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 14 }}>Peça orçamento grátis para empresas especializadas.</p>
              <Link href="/orcamento" className="btn btn--magenta btn--block">
                Solicitar orçamento
              </Link>
            </div>
            {ads[0]?.image && (
              <a href={ads[0].link ? adHref(ads[0].id) : "#"} className="aside-ad" target="_blank" rel="noopener sponsored">
                <img src={ads[0].image} alt={ads[0].title} loading="lazy" />
              </a>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
