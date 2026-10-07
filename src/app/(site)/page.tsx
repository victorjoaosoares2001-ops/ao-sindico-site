import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AgendaCard, PostCard, SectionHead, SupplierCard } from "@/components/site/Cards";
import { Scroller } from "@/components/site/Client";
import { QuoteForm } from "@/components/site/QuoteForm";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { activeCampaigns, publishedCategories, supplierCardInclude, upcomingCourses, upcomingEvents } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const [s, categories, featured, marquee, articles, events, courses, partners, ads, strip] = await Promise.all([
    getSettings(),
    publishedCategories(),
    db.supplier.findMany({
      where: { published: true },
      include: supplierCardInclude,
      orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }),
    db.supplier.findMany({ where: { published: true }, select: { name: true, slug: true }, orderBy: { order: "asc" }, take: 24 }),
    db.article.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      include: { section: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 5,
    }),
    upcomingEvents(2),
    upcomingCourses(2),
    db.partner.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { name: "asc" }], take: 12 }),
    activeCampaigns("home"),
    activeCampaigns("faixa", 1),
  ]);

  const [lead, ...restArticles] = articles;
  const stats = [1, 2, 3, 4]
    .map((n) => ({ value: s[`stat${n}_value` as keyof typeof s], label: s[`stat${n}_label` as keyof typeof s] }))
    .filter((x) => x.value);
  const quickTags = categories.slice(0, 5);

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

              <form action="/fornecedores" className="hero__search" role="search">
                <Icon name="search" style={{ color: "rgba(255,255,255,.6)", flex: "none" }} />
                <label htmlFor="hero-q" className="sr-only">
                  Buscar fornecedor
                </label>
                <input id="hero-q" name="q" placeholder="Buscar fornecedor, serviço ou empresa" />
                <button className="btn btn--glass btn--sm" style={{ minHeight: 46 }}>
                  <Icon name="arrowRight" size={16} />
                  <span>Buscar</span>
                </button>
              </form>
              {quickTags.length > 0 && (
                <div className="hero__tags">
                  {quickTags.map((c) => (
                    <Link key={c.id} href={`/fornecedores?categoria=${c.slug}`}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" data-reveal style={{ ["--d" as string]: ".12s" }}>
              <QuoteForm categories={categories.map((c) => c.name)} source="home" />
            </div>
          </div>

          {stats.length > 0 && (
            <div className="stats" data-reveal style={{ ["--d" as string]: ".2s" }}>
              {stats.map((st) => (
                <div key={st.label}>
                  <strong>{st.value}</strong>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Marquee de empresas ---------- */}
      {marquee.length > 3 && (
        <div className="marquee" aria-label="Empresas no portal">
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
                  <a key={ad.id} href={ad.link} className="ad" target="_blank" rel="noopener sponsored">
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

      {/* ---------- Categorias ---------- */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead
              num="01"
              label="Categorias"
              title="Todo serviço que o condomínio precisa,"
              accent="com quem entende."
              text="Da portaria à fachada: encontre empresas especializadas e peça orçamento em poucos cliques."
              link={{ href: "/fornecedores", label: "Ver todos os fornecedores" }}
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
            </div>
          </div>
        </section>
      )}

      {/* ---------- Fornecedores ---------- */}
      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead
              num="02"
              label="Fornecedores"
              title="Empresas em destaque,"
              accent="prontas para atender."
              text="Perfis completos, serviços detalhados e pedido de orçamento direto pelo portal."
              link={{ href: "/fornecedores", label: "Guia completo" }}
            />
            <div className="sup-grid">
              {featured.map((sup, i) => (
                <SupplierCard key={sup.id} s={sup} delay={(i % 3) * 0.06} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Faixa de anúncio ---------- */}
      {strip[0]?.image && (
        <div className="container" style={{ marginBottom: 24 }}>
          <a href={strip[0].link ?? "#"} className="ad" style={{ display: "block" }} target="_blank" rel="noopener sponsored">
            <img src={strip[0].image} alt={strip[0].title} loading="lazy" />
            <span className="chip chip--glass ad__label">Publicidade</span>
          </a>
        </div>
      )}

      {/* ---------- Informe-se ---------- */}
      {lead && (
        <section className="section">
          <div className="container">
            <SectionHead
              num="03"
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
                  <div>
                    {lead.section && <span className="chip chip--glass">{lead.section.name}</span>}
                  </div>
                  <h3>{lead.title}</h3>
                  {lead.excerpt && <p>{lead.excerpt}</p>}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                    {lead.author ? `${lead.author} · ` : ""}
                    {formatDate(lead.publishedAt)}
                  </span>
                </div>
              </Link>
              <div className="news-list">
                {restArticles.map((a, i) => (
                  <Link key={a.id} href={`/informe-se/${a.slug}`} className="news-item" data-reveal style={{ ["--d" as string]: `${i * 0.06}s` }}>
                    <div className="news-item__img">{a.cover && <img src={a.cover} alt="" loading="lazy" />}</div>
                    <div>
                      <div className="meta">
                        {a.section && <b>{a.section.name}</b>}
                        <span>{formatDate(a.publishedAt, { day: "2-digit", month: "short" })}</span>
                      </div>
                      <h3>{a.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Agenda ---------- */}
      {(events.length > 0 || courses.length > 0) && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead
              num="04"
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

      {/* ---------- Parceiros ---------- */}
      {partners.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SectionHead num="05" label="Parceiros" title="Quem caminha" accent="com a gente." link={{ href: "/parceiros", label: "Conheça os parceiros" }} />
            <div className="partners">
              {partners.map((p, i) => {
                const inner = p.logo ? <img src={p.logo} alt={p.name} loading="lazy" /> : <span>{p.name}</span>;
                return p.url ? (
                  <a key={p.id} href={p.url} className="partner" target="_blank" rel="noopener" data-reveal style={{ ["--d" as string]: `${(i % 6) * 0.04}s` }}>
                    {inner}
                  </a>
                ) : (
                  <div key={p.id} className="partner" data-reveal style={{ ["--d" as string]: `${(i % 6) * 0.04}s` }}>
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
            <ul className="cta__list">
              <li>
                <Icon name="building" /> Perfil completo no guia de fornecedores
              </li>
              <li>
                <Icon name="inbox" /> Pedidos de orçamento de síndicos
              </li>
              <li>
                <Icon name="megaphone" /> Banners no portal e newsletter
              </li>
              <li>
                <Icon name="users" /> Patrocínio dos encontros de síndicos
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
