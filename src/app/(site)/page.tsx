import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AgendaCard, initials, PostCard, SectionHead, SupplierCard } from "@/components/site/Cards";
import { Scroller } from "@/components/site/Client";
import { VideoPlayer } from "@/components/site/Forms";
import { QuoteForm } from "@/components/site/QuoteForm";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  activeCampaigns,
  adHref,
  portalNumbers,
  publishedCategories,
  ratings,
  supplierCardInclude,
  upcomingCourses,
  upcomingEvents,
  youtubeId,
} from "@/lib/queries";
import { getSettings, lines } from "@/lib/settings";

export default async function HomePage() {
  const now = new Date();
  const [s, categories, featured, marquee, articles, events, courses, partners, ads, strip, numbers, questions, videos, authors] = await Promise.all([
    getSettings(),
    publishedCategories(),
    db.supplier.findMany({
      where: { published: true, featured: true },
      include: supplierCardInclude,
      orderBy: [{ plan: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }),
    db.supplier.findMany({ where: { published: true, plan: { in: ["premium", "verificado"] } }, select: { name: true, slug: true }, orderBy: { order: "asc" }, take: 24 }),
    db.article.findMany({
      where: { published: true, publishedAt: { lte: now } },
      include: { section: true, authorRef: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 8,
    }),
    upcomingEvents(2),
    upcomingCourses(2),
    db.partner.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { name: "asc" }], take: 12 }),
    activeCampaigns("home"),
    activeCampaigns("faixa", 1),
    portalNumbers(),
    db.question.findMany({ where: { published: true }, orderBy: [{ answeredAt: "desc" }, { createdAt: "desc" }], take: 4 }),
    db.video.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 2 }),
    db.author.findMany({ where: { published: true, articles: { some: { published: true } } }, orderBy: [{ order: "asc" }, { articles: { _count: "desc" } }], take: 8, include: { _count: { select: { articles: true } } } }),
  ]);

  const lead = articles.find((a) => a.featured && a.cover) ?? articles.find((a) => a.cover) ?? articles[0];
  const rest = articles.filter((a) => a.id !== lead?.id).slice(0, 4);
  const more = articles.filter((a) => a.id !== lead?.id).slice(4, 7);
  const rate = await ratings(featured.map((f) => f.id));
  const formats = lines(s.advertise_formats);

  // números reais, só os que existem
  const facts = [
    numbers.suppliers > 0 && { n: numbers.suppliers, l: "empresas no guia" },
    numbers.pros > 0 && { n: numbers.pros, l: "síndicos profissionais" },
    numbers.articles > 0 && { n: numbers.articles, l: "matérias publicadas" },
    numbers.events > 0 && { n: numbers.events, l: numbers.events === 1 ? "evento" : "eventos" },
  ].filter(Boolean) as { n: number; l: string }[];

  return (
    <>
      {/* ---------- Topo ---------- */}
      <section className="hero">
        {s.hero_image && <img className="hero__bg" src={s.hero_image} alt="" />}
        <div className="container">
          <div className="hero__grid">
            <div data-reveal>
              <span className="chip chip--glass">
                <span className="pulse" /> {s.hero_kicker}
              </span>
              <h1>
                {s.hero_title} <span className="serif">{s.hero_title_accent}</span>
              </h1>
              <p className="hero__lead">{s.hero_subtitle}</p>

              <form action="/busca" className="hero__search" role="search">
                <Icon name="search" style={{ color: "rgba(255,255,255,.6)", flex: "none" }} />
                <label htmlFor="hero-q" className="sr-only">
                  Buscar no portal
                </label>
                <input id="hero-q" name="q" placeholder="Buscar empresa, serviço, matéria ou dúvida" />
                <button className="btn btn--glass btn--sm" style={{ minHeight: 46 }}>
                  <Icon name="arrowRight" size={16} />
                  <span>Buscar</span>
                </button>
              </form>
              <div className="hero__tags">
                {categories.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/fornecedores?categoria=${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
              {facts.length > 0 && (
                <div className="facts-row">
                  {facts.map((f) => (
                    <span key={f.l}>
                      <b>{f.n}</b> {f.l}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" data-reveal style={{ ["--d" as string]: ".12s" }}>
              <QuoteForm categories={categories.map((c) => ({ name: c.name, icon: c.icon }))} source="home" compact />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Empresas parceiras ---------- */}
      {marquee.length > 3 && (
        <div className="marquee" aria-label="Empresas do portal">
          <div className="marquee__track">
            {[...marquee, ...marquee].map((m, i) => (
              <Link key={i} href={`/fornecedores/${m.slug}`} className="marquee__item" tabIndex={i >= marquee.length ? -1 : 0}>
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Anúncios ---------- */}
      {ads.length > 0 && (
        <section className="section--tight">
          <div className="container">
            <Scroller label="Publicidade">
              {ads.map((ad) => {
                const img = <img src={ad.image ?? ""} alt={ad.title} loading="lazy" />;
                return ad.link ? (
                  <a key={ad.id} href={adHref(ad.id)} className="ad" target="_blank" rel="noopener sponsored">
                    {img}
                  </a>
                ) : (
                  <div key={ad.id} className="ad">
                    {img}
                  </div>
                );
              })}
            </Scroller>
          </div>
        </section>
      )}

      {/* ---------- Informe-se ---------- */}
      {lead && (
        <section className="section" style={{ paddingTop: ads.length ? undefined : "clamp(40px,6vw,72px)" }}>
          <div className="container">
            <SectionHead
              num="01"
              label="Informe-se"
              title="Conteúdo que ajuda"
              accent="a decidir melhor."
              text="Jurídico, manutenção, finanças e convivência — com colunistas que vivem o dia a dia do condomínio."
              link={{ href: "/informe-se", label: "Todas as matérias" }}
            />
            <div className="news">
              <Link href={`/informe-se/${lead.slug}`} className="news-feature" data-reveal>
                {lead.cover && <img src={lead.cover} alt="" />}
                <div className="news-feature__body">
                  <div>{lead.section && <span className="chip chip--glass">{lead.section.name}</span>}</div>
                  <h3>{lead.title}</h3>
                  {lead.excerpt && <p>{lead.excerpt}</p>}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                    {lead.authorRef ? `${lead.authorRef.name} · ` : ""}
                    {formatDate(lead.publishedAt)}
                  </span>
                </div>
              </Link>
              <div className="news-list">
                {rest.map((a, i) => (
                  <Link key={a.id} href={`/informe-se/${a.slug}`} className="news-item" data-reveal style={{ ["--d" as string]: `${i * 0.06}s` }}>
                    <div className="news-item__img">{a.cover && <img src={a.cover} alt="" loading="lazy" />}</div>
                    <div>
                      <div className="meta">
                        {a.section && <b>{a.section.name}</b>}
                        <span>{formatDate(a.publishedAt, { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                      <h3>{a.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            {more.length > 0 && (
              <div className="post-grid" style={{ marginTop: 40 }}>
                {more.map((a, i) => (
                  <PostCard key={a.id} a={a} delay={i * 0.05} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- Categorias ---------- */}
      {categories.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead
              num="02"
              label="Fornecedores"
              title="Todo serviço que o condomínio precisa,"
              accent="com quem entende."
              text="Encontre empresas especializadas e peça orçamento em poucos cliques."
              link={{ href: "/fornecedores", label: "Guia completo de fornecedores" }}
            />
            <div className="cat-grid">
              {categories.map((c, i) => (
                <Link key={c.id} href={`/fornecedores?categoria=${c.slug}`} className="cat-card" data-reveal style={{ ["--d" as string]: `${(i % 4) * 0.06}s` }}>
                  <span className="cat-card__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cat-card__go">
                    <Icon name="arrowUpRight" size={16} />
                  </span>
                  <span className="cat-card__icon">
                    <Icon name={c.icon || "sparkles"} size={22} />
                  </span>
                  <h3>{c.name}</h3>
                  {c.description && <p>{c.description}</p>}
                </Link>
              ))}
              <Link href="/sindicos-profissionais" className="cat-card" data-reveal>
                <span className="cat-card__num">{numbers.pros > 0 ? `${numbers.pros} perfis` : "Novo"}</span>
                <span className="cat-card__go">
                  <Icon name="arrowUpRight" size={16} />
                </span>
                <span className="cat-card__icon" style={{ background: "var(--magenta-soft)", color: "var(--magenta)" }}>
                  <Icon name="users" size={22} />
                </span>
                <h3>Síndicos profissionais</h3>
                <p>Encontre quem administra o seu condomínio.</p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Fornecedores em destaque ---------- */}
      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead num="03" label="Em destaque" title="Empresas" accent="em destaque." link={{ href: "/fornecedores", label: "Ver todas" }} />
            <div className="sup-grid">
              {featured.map((sup, i) => (
                <SupplierCard key={sup.id} s={sup} rating={rate.get(sup.id)} delay={(i % 3) * 0.06} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Faixa de anúncio ---------- */}
      {strip[0]?.image && (
        <div className="container" style={{ marginBottom: 24 }}>
          <a href={strip[0].link ? adHref(strip[0].id) : "#"} className="ad" style={{ display: "block" }} target="_blank" rel="noopener sponsored">
            <img src={strip[0].image} alt={strip[0].title} loading="lazy" />
            <span className="chip chip--glass ad__label">Publicidade</span>
          </a>
        </div>
      )}

      {/* ---------- Tira-Dúvidas + vídeos ---------- */}
      {(questions.length > 0 || videos.length > 0) && (
        <section className="section" style={{ paddingTop: strip[0] ? undefined : 0 }}>
          <div className="container split">
            {questions.length > 0 && (
              <div>
                <div className="eyebrow">
                  <b>04</b> Tira-Dúvidas
                </div>
                <h2 className="h-display" style={{ fontSize: "clamp(28px,3.4vw,42px)" }}>
                  Pergunte. <span className="serif">Especialistas respondem.</span>
                </h2>
                <div style={{ marginTop: 18 }}>
                  {questions.map((q) => (
                    <Link key={q.id} href={`/tira-duvidas/${q.slug}`} className="qa-item">
                      <span className="qa-item__mark">?</span>
                      <div>
                        <h3>{q.title}</h3>
                        {q.answer && <p>{q.answer.replace(/[#*>]/g, "")}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
                  <Link href="/tira-duvidas#perguntar" className="btn btn--arrow">
                    Enviar minha pergunta
                    <span className="btn__dot">
                      <Icon name="arrowUpRight" size={16} />
                    </span>
                  </Link>
                  <Link href="/tira-duvidas" className="btn btn--ghost">
                    Ver todas
                  </Link>
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div>
                <div className="eyebrow">
                  <b>05</b> Vídeos
                </div>
                <h2 className="h-display" style={{ fontSize: "clamp(28px,3.4vw,42px)" }}>
                  Assista e <span className="serif">aprenda.</span>
                </h2>
                <div style={{ display: "grid", gap: 20, marginTop: 18 }}>
                  {videos.map((v) => {
                    const id = youtubeId(v.url);
                    return id ? (
                      <div key={v.id} className="video-card">
                        <VideoPlayer id={id} title={v.title} />
                        <h3>{v.title}</h3>
                      </div>
                    ) : null;
                  })}
                </div>
                <Link href="/videos" className="link-arrow" style={{ marginTop: 16 }}>
                  Todos os vídeos <Icon name="arrowUpRight" size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- Agenda ---------- */}
      {(events.length > 0 || courses.length > 0) && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead
              num="06"
              label="Agenda"
              title="Encontros e cursos"
              accent="para síndicos."
              text="Networking, capacitação e certificado de participação."
              link={{ href: "/eventos", label: "Ver agenda completa" }}
            />
            <div className="agenda">
              {events.map((e, i) => (
                <AgendaCard key={e.id} item={e} kind="evento" delay={i * 0.06} />
              ))}
              {courses.map((c, i) => (
                <AgendaCard key={c.id} item={c} kind="curso" delay={(i + 2) * 0.06} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Colunistas ---------- */}
      {authors.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead num="07" label="Colunistas" title="Quem escreve" accent="no Ao Síndico." link={{ href: "/colunistas", label: "Todos os colunistas" }} />
            <div className="author-grid">
              {authors.map((a) => (
                <Link key={a.id} href={`/colunistas/${a.slug}`} className="author-tile" data-reveal>
                  <span className="avatar">{a.photo ? <img src={a.photo} alt="" loading="lazy" /> : initials(a.name)}</span>
                  <span>
                    <strong>{a.name}</strong>
                    <span>
                      {a.role ? `${a.role} · ` : ""}
                      {a._count.articles} {a._count.articles === 1 ? "matéria" : "matérias"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Parceiros ---------- */}
      {partners.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead num="08" label="Parceiros" title="Quem caminha" accent="com a gente." link={{ href: "/parceiros", label: "Conheça os parceiros" }} />
            <div className="partners">
              {partners.map((p, i) => {
                const inner = p.logo ? <img src={p.logo} alt={p.name} loading="lazy" /> : <span>{p.name}</span>;
                return p.url ? (
                  <a key={p.id} href={p.url} className="partner" target="_blank" rel="noopener" data-reveal style={{ ["--d" as string]: `${(i % 6) * 0.04}s` }}>
                    {inner}
                  </a>
                ) : (
                  <div key={p.id} className="partner" data-reveal>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Anuncie ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta" data-reveal>
            <div>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,.55)" }}>
                <b style={{ color: "var(--yellow)" }}>Para empresas</b>
              </div>
              <h2>
                Sua empresa na frente <span className="serif">de quem decide.</span>
              </h2>
              <p>{s.advertise_text}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
                <Link href="/anuncie" className="btn btn--yellow btn--arrow">
                  Quero anunciar
                  <span className="btn__dot">
                    <Icon name="arrowUpRight" size={16} />
                  </span>
                </Link>
              </div>
            </div>
            {formats.length > 0 && (
              <ul className="cta__list">
                {formats.slice(0, 5).map((f) => (
                  <li key={f}>
                    <Icon name="check" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
