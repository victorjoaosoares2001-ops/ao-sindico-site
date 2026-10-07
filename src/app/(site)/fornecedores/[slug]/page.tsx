import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { initials, SupplierCard } from "@/components/site/Cards";
import { QuoteForm } from "@/components/site/QuoteForm";
import { db } from "@/lib/db";
import { splitList, whatsappLink } from "@/lib/format";
import { publishedCategories, supplierCardInclude } from "@/lib/queries";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return db.supplier.findFirst({ where: { slug, published: true }, include: supplierCardInclude });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = await load((await params).slug);
  if (!s) return {};
  return { title: s.name, description: s.tagline ?? s.description?.slice(0, 160) ?? undefined, openGraph: { images: s.cover ? [s.cover] : undefined } };
}

export default async function SupplierPage({ params }: { params: Params }) {
  const s = await load((await params).slug);
  if (!s) notFound();

  const [categories, related] = await Promise.all([
    publishedCategories(),
    db.supplier.findMany({
      where: { published: true, id: { not: s.id }, categories: { some: { slug: { in: s.categories.map((c) => c.slug) } } } },
      include: supplierCardInclude,
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      take: 3,
    }),
  ]);
  const services = splitList(s.services);
  const wa = whatsappLink(s.whatsapp, `Olá! Encontrei a ${s.name} no portal Ao Síndico.`);

  return (
    <>
      <section className="page-hero">
        {s.cover && <img className="hero__bg" src={s.cover} alt="" style={{ position: "absolute", inset: 0, zIndex: -2, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }} />}
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <Link href="/fornecedores">Fornecedores</Link> / <span>{s.name}</span>
          </nav>
          <div className="profile__head">
            <span className="profile__logo">{s.logo ? <img src={s.logo} alt={`Logo ${s.name}`} /> : initials(s.name)}</span>
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
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
                  <Link key={c.slug} href={`/fornecedores?categoria=${c.slug}`} className="chip chip--glass">
                    {c.name}
                  </Link>
                ))}
              </div>
              <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>{s.name}</h1>
              {s.tagline && <p style={{ marginTop: 10 }}>{s.tagline}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container profile">
          <div>
            {s.description && (
              <div className="card" data-reveal>
                <h2>Quem somos</h2>
                <p style={{ color: "var(--ink-2)", whiteSpace: "pre-line" }}>{s.description}</p>
              </div>
            )}
            {services.length > 0 && (
              <div className="card" data-reveal>
                <h2>Serviços</h2>
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
                {s.city && (
                  <li>
                    <span>
                      <Icon name="mapPin" /> {s.city}
                      {s.state ? ` · ${s.state}` : ""}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <aside className="sticky-aside">
            <div className="glass-card glass-card--light">
              <QuoteForm
                tone="light"
                title={`Orçamento com ${s.name.split(" ").slice(0, 3).join(" ")}`}
                categories={categories.map((c) => c.name)}
                suppliers={[{ id: s.id, name: s.name }]}
                preselected={[s.id]}
                initial={{ category: s.categories[0]?.name }}
                source={`fornecedor:${s.slug}`}
              />
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 className="h-display" style={{ fontSize: "clamp(28px,3.5vw,40px)", marginBottom: 28 }}>
              Empresas <span className="serif">semelhantes</span>
            </h2>
            <div className="sup-grid">
              {related.map((r) => (
                <SupplierCard key={r.id} s={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
