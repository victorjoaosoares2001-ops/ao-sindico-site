import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Parceiros e patrocinadores", description: "Empresas e instituições parceiras do portal Ao Síndico." };

const GROUPS = [
  { kind: "patrocinador", title: "Patrocinadores" },
  { kind: "parceiro", title: "Parceiros" },
  { kind: "apoio", title: "Apoio" },
];

export default async function PartnersPage() {
  const partners = await db.partner.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { name: "asc" }] });
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Parceiros</span>
          </nav>
          <h1>
            Quem caminha <span className="serif">com a gente.</span>
          </h1>
          <p>Empresas e instituições que apoiam os síndicos e tornam nossos encontros e conteúdos possíveis.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {GROUPS.map((g) => {
            const list = partners.filter((p) => p.kind === g.kind);
            if (!list.length) return null;
            return (
              <div key={g.kind} style={{ marginBottom: 56 }}>
                <h2 style={{ fontSize: 26, marginBottom: 22 }}>{g.title}</h2>
                <div className="partners" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {list.map((p) => (
                    <a
                      key={p.id}
                      href={p.url ?? undefined}
                      target={p.url ? "_blank" : undefined}
                      rel="noopener"
                      className="partner"
                      data-reveal
                      style={{ minHeight: 160, alignContent: "center" }}
                    >
                      {p.logo ? <img src={p.logo} alt={p.name} loading="lazy" /> : <strong style={{ fontSize: 18 }}>{p.name}</strong>}
                      {p.description && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-3)" }}>{p.description}</span>}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="cta" style={{ marginTop: 24 }}>
            <div>
              <h2>
                Seja um <span className="serif">parceiro.</span>
              </h2>
              <p>Patrocine nossos encontros e apareça para milhares de síndicos.</p>
            </div>
            <div>
              <Link href="/anuncie" className="btn btn--yellow btn--arrow">
                Falar com o comercial
                <span className="btn__dot">
                  <Icon name="arrowUpRight" size={16} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
