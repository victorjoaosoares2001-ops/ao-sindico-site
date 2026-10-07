import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AgendaCard, SupplierCard } from "@/components/site/Cards";
import { formatDate } from "@/lib/format";
import { activeCampaigns, adHref, globalSearch, ratings } from "@/lib/queries";

export const metadata: Metadata = { title: "Busca", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const r = q.length >= 2 ? await globalSearch(q) : null;
  const total = r ? r.suppliers.length + r.articles.length + r.questions.length + r.events.length + r.courses.length + r.videos.length : 0;
  const [rate, ads] = await Promise.all([ratings(r?.suppliers.map((s) => s.id) ?? []), activeCampaigns("lateral", 1)]);
  const enc = encodeURIComponent(q);

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Busca</span>
          </nav>
          <h1>{q ? <>Resultados para “{q}”</> : "Buscar no portal"}</h1>
          <form action="/busca" className="search-big" role="search">
            <input name="q" defaultValue={q} placeholder="Empresas, serviços, matérias, dúvidas, eventos…" aria-label="Termo de busca" autoFocus={!q} />
            <button className="btn btn--yellow">Buscar</button>
          </form>
        </div>
      </section>

      <section className="section section--first">
        <div className="container with-aside">
          <div>
            {!r && <p className="result-count">Digite pelo menos 2 letras.</p>}
            {r && total === 0 && (
              <div className="empty">
                <Icon name="search" size={28} />
                <strong>Nada encontrado para “{q}”.</strong>
                <p>Tente outra palavra ou peça um orçamento: nossa equipe encontra o fornecedor para você.</p>
                <Link href="/orcamento" className="btn btn--magenta">
                  Pedir orçamento
                </Link>
              </div>
            )}

            {r && r.suppliers.length > 0 && (
              <div className="result-group">
                <div className="result-group__head">
                  <h2>Fornecedores e síndicos</h2>
                  <Link href={`/fornecedores?q=${enc}`} className="link-arrow">
                    Ver mais <Icon name="arrowUpRight" size={15} />
                  </Link>
                </div>
                <div className="sup-grid">
                  {r.suppliers.slice(0, 6).map((s) => (
                    <SupplierCard key={s.id} s={s} rating={rate.get(s.id)} />
                  ))}
                </div>
              </div>
            )}

            {r && r.articles.length > 0 && (
              <div className="result-group">
                <div className="result-group__head">
                  <h2>Matérias</h2>
                  <Link href={`/informe-se?q=${enc}`} className="link-arrow">
                    Ver mais <Icon name="arrowUpRight" size={15} />
                  </Link>
                </div>
                <div className="dense-list">
                  {r.articles.map((a) => (
                    <Link key={a.id} href={`/informe-se/${a.slug}`} className="dense-item">
                      <div>
                        <div className="meta" style={{ margin: 0 }}>
                          {a.section && <b>{a.section.name}</b>}
                          <span>{formatDate(a.publishedAt)}</span>
                          {a.authorRef && <span>· {a.authorRef.name}</span>}
                        </div>
                        <h3>{a.title}</h3>
                        {a.excerpt && <p>{a.excerpt}</p>}
                      </div>
                      <Icon name="arrowUpRight" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {r && r.questions.length > 0 && (
              <div className="result-group">
                <div className="result-group__head">
                  <h2>Tira-Dúvidas</h2>
                  <Link href={`/tira-duvidas?q=${enc}`} className="link-arrow">
                    Ver mais <Icon name="arrowUpRight" size={15} />
                  </Link>
                </div>
                {r.questions.map((qq) => (
                  <Link key={qq.id} href={`/tira-duvidas/${qq.slug}`} className="qa-item">
                    <span className="qa-item__mark">?</span>
                    <div>
                      <h3>{qq.title}</h3>
                      {qq.answer && <p>{qq.answer.replace(/[#*>]/g, "")}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {r && (r.events.length > 0 || r.courses.length > 0) && (
              <div className="result-group">
                <div className="result-group__head">
                  <h2>Eventos e cursos</h2>
                </div>
                <div className="agenda">
                  {r.events.map((e) => (
                    <AgendaCard key={e.id} item={e} kind="evento" />
                  ))}
                  {r.courses.map((c) => (
                    <AgendaCard key={c.id} item={c} kind="curso" />
                  ))}
                </div>
              </div>
            )}

            {r && r.videos.length > 0 && (
              <div className="result-group">
                <div className="result-group__head">
                  <h2>Vídeos</h2>
                  <Link href="/videos" className="link-arrow">
                    Ver todos <Icon name="arrowUpRight" size={15} />
                  </Link>
                </div>
                <div className="dense-list">
                  {r.videos.map((v) => (
                    <Link key={v.id} href={`/videos#${v.slug}`} className="dense-item">
                      <h3>{v.title}</h3>
                      <Icon name="youtube" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="sticky-aside" style={{ display: "grid", gap: 18 }}>
            <div className="aside-box">
              <h3>Não achou o que precisava?</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 14 }}>Descreva o serviço e nós encaminhamos às empresas certas.</p>
              <Link href={`/orcamento${q ? `?servico=${enc}` : ""}`} className="btn btn--magenta btn--block">
                Pedir orçamento grátis
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
