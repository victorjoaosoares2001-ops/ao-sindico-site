import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { initials, SupplierCard } from "@/components/site/Cards";
import { ReviewForm } from "@/components/site/Forms";
import { QuoteForm } from "@/components/site/QuoteForm";
import { db } from "@/lib/db";
import { formatDate, splitList, whatsappLink } from "@/lib/format";
import { submitReview } from "@/lib/public-actions";
import { PRO_SLUG, publishedCategories, ratings, supplierCardInclude } from "@/lib/queries";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return db.supplier.findFirst({ where: { slug: { equals: decodeURIComponent(slug), mode: "insensitive" }, published: true }, include: supplierCardInclude });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = await load((await params).slug);
  if (!s) return {};
  return { title: s.name, description: s.tagline ?? s.description?.slice(0, 160) ?? undefined, openGraph: { images: s.cover ?? s.logo ?? undefined } };
}

export default async function SupplierPage({ params }: { params: Params }) {
  const s = await load((await params).slug);
  if (!s) notFound();
  const isPro = s.categories.some((c) => c.slug === PRO_SLUG);

  const [categories, related, reviews] = await Promise.all([
    publishedCategories(),
    db.supplier.findMany({
      where: { published: true, id: { not: s.id }, categories: { some: { slug: { in: s.categories.map((c) => c.slug) } } } },
      include: supplierCardInclude,
      orderBy: [{ featured: "desc" }, { plan: "desc" }, { order: "asc" }],
      take: 3,
    }),
    db.review.findMany({ where: { supplierId: s.id, status: "aprovada" }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const rate = await ratings([s.id, ...related.map((r) => r.id)]);
  const mine = rate.get(s.id);
  const services = splitList(s.services);
  const wa = whatsappLink(s.whatsapp, `Olá! Encontrei a ${s.name} no portal Ao Síndico.`);
  const quoteCats = categories.map((c) => ({ name: c.name, icon: c.icon }));
  const firstCat = s.categories.find((c) => c.slug !== PRO_SLUG)?.name;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s.name,
    image: s.logo ?? undefined,
    address: s.city ? { "@type": "PostalAddress", addressLocality: s.city, addressRegion: s.state ?? undefined } : undefined,
    aggregateRating: mine?.count ? { "@type": "AggregateRating", ratingValue: mine.avg.toFixed(1), reviewCount: mine.count } : undefined,
  };

  return (
    <>
      <section className="page-hero page-hero--slim">
        {s.cover && <img src={s.cover} alt="" style={{ position: "absolute", inset: 0, zIndex: -2, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }} />}
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / {isPro ? <Link href="/sindicos-profissionais">Síndicos profissionais</Link> : <Link href="/fornecedores">Fornecedores</Link>} / <span>{s.name}</span>
          </nav>
          <div className="profile__head">
            <span className="profile__logo">{s.logo ? <img src={s.logo} alt={`Logo ${s.name}`} /> : initials(s.name)}</span>
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {s.plan === "premium" && (
                  <span className="chip chip--yellow">
                    <Icon name="star" size={12} /> Premium
                  </span>
                )}
                {s.plan === "verificado" && (
                  <span className="chip chip--teal">
                    <Icon name="check" size={12} /> Verificado
                  </span>
                )}
                {s.categories.map((c) => (
                  <Link key={c.slug} href={c.slug === PRO_SLUG ? "/sindicos-profissionais" : `/fornecedores?categoria=${c.slug}`} className="chip chip--glass">
                    {c.name}
                  </Link>
                ))}
                {mine?.count ? (
                  <a href="#avaliacoes" className="rating-badge">
                    <b>★ {mine.avg.toFixed(1)}</b> {mine.count} {mine.count === 1 ? "avaliação" : "avaliações"}
                  </a>
                ) : null}
              </div>
              <h1 style={{ fontSize: "clamp(28px, 4.4vw, 50px)" }}>{s.name}</h1>
              {s.tagline && <p style={{ marginTop: 8 }}>{s.tagline}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--first">
        <div className="container profile">
          <div>
            {s.description && (
              <div className="card" data-reveal>
                <h2>{isPro ? "Sobre" : "Quem somos"}</h2>
                <p style={{ color: "var(--ink-2)", whiteSpace: "pre-line" }}>{s.description}</p>
              </div>
            )}
            {services.length > 0 && (
              <div className="card" data-reveal>
                <h2>{isPro ? "Atuação" : "Produtos e serviços"}</h2>
                <div className="services">
                  {services.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="card" data-reveal>
              <h2>Contato</h2>
              <ul className="contact-list">
                {wa && (
                  <li>
                    <a href={wa} target="_blank" rel="noopener">
                      <Icon name="whatsapp" /> {s.whatsapp}
                    </a>
                  </li>
                )}
                {s.phone && (
                  <li>
                    <a href={`tel:${s.phone.replace(/\D/g, "")}`}>
                      <Icon name="phone" /> {s.phone}
                    </a>
                  </li>
                )}
                {s.email && (
                  <li>
                    <a href={`mailto:${s.email}`}>
                      <Icon name="mail" /> {s.email}
                    </a>
                  </li>
                )}
                {s.website && (
                  <li>
                    <a href={s.website} target="_blank" rel="noopener">
                      <Icon name="globe" /> {s.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
                {s.instagram && (
                  <li>
                    <a href={s.instagram} target="_blank" rel="noopener">
                      <Icon name="instagram" /> Instagram
                    </a>
                  </li>
                )}
                {s.facebook && (
                  <li>
                    <a href={s.facebook} target="_blank" rel="noopener">
                      <Icon name="facebook" /> Facebook
                    </a>
                  </li>
                )}
                {(s.city || s.address) && (
                  <li>
                    <span>
                      <Icon name="mapPin" /> {[s.address, s.city, s.state].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                )}
                {!wa && !s.phone && !s.email && !s.website && (
                  <li>
                    <span>
                      <Icon name="inbox" /> Peça um orçamento ao lado: nossa equipe faz a ponte com a empresa.
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <div className="card" id="avaliacoes" data-reveal style={{ scrollMarginTop: 110 }}>
              <h2>
                Avaliações{" "}
                {mine?.count ? (
                  <span className="stars">
                    <b>{"★".repeat(Math.round(mine.avg))}</b> {mine.avg.toFixed(1)} de 5 · {mine.count}
                  </span>
                ) : null}
              </h2>
              {reviews.length > 0 ? (
                <div className="reviews-list" style={{ marginBottom: 24 }}>
                  {reviews.map((r) => (
                    <article key={r.id} className="review">
                      <header>
                        <strong>
                          {r.name}
                          {r.condo ? <span style={{ fontWeight: 400, color: "var(--ink-3)" }}> · {r.condo}</span> : null}
                        </strong>
                        <span className="stars">
                          <b>
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </b>{" "}
                          {formatDate(r.createdAt, { month: "short", year: "numeric" })}
                        </span>
                      </header>
                      {r.comment && <p>{r.comment}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--ink-3)", marginBottom: 18 }}>Ainda sem avaliações publicadas. Já contratou? Conte como foi.</p>
              )}
              <details className="details-box">
                <summary>Avaliar {s.name}</summary>
                <div style={{ marginTop: 16 }}>
                  <ReviewForm action={submitReview.bind(null, s.id)} />
                </div>
              </details>
            </div>
          </div>

          <aside className="sticky-aside">
            <div className="glass-card glass-card--light">
              <QuoteForm
                tone="light"
                title={isPro ? "Pedir proposta" : "Pedir orçamento"}
                categories={isPro ? [{ name: "Síndico Profissional", icon: "users" }, ...quoteCats] : quoteCats}
                suppliers={[{ id: s.id, name: s.name }]}
                preselected={[s.id]}
                initial={{ category: isPro ? "Síndico Profissional" : firstCat }}
                source={`fornecedor:${s.slug}`}
                compact
              />
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 className="h-display" style={{ fontSize: "clamp(26px,3.2vw,38px)", marginBottom: 24 }}>
              {isPro ? "Outros síndicos" : "Empresas"} <span className="serif">semelhantes</span>
            </h2>
            <div className="sup-grid">
              {related.map((r) => (
                <SupplierCard key={r.id} s={r} rating={rate.get(r.id)} />
              ))}
            </div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
