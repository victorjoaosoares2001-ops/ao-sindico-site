import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { SupplierCard } from "@/components/site/Cards";
import { db } from "@/lib/db";
import { PRO_SLUG, ratings, supplierCardInclude } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Síndicos profissionais",
  description: "Encontre síndicos profissionais para condomínios residenciais e comerciais. Compare perfis e peça uma proposta.",
};

const PER_PAGE = 18;

export default async function ProsPage({ searchParams }: { searchParams: Promise<{ q?: string; cidade?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const city = sp.cidade?.trim() ?? "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  const where: Prisma.SupplierWhereInput = {
    published: true,
    categories: { some: { slug: PRO_SLUG } },
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { services: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [s, total, pros] = await Promise.all([
    getSettings(),
    db.supplier.count({ where }),
    db.supplier.findMany({ where, include: supplierCardInclude, orderBy: [{ featured: "desc" }, { plan: "desc" }, { order: "asc" }, { name: "asc" }], take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
  ]);
  const rate = await ratings(pros.map((p) => p.id));
  const pages = Math.ceil(total / PER_PAGE);
  const link = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (city) p.set("cidade", city);
    if (n > 1) p.set("pagina", String(n));
    return `/sindicos-profissionais${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <section className="page-hero">
        <div className="container page-hero__row">
          <div>
            <nav className="crumbs" aria-label="Você está em">
              <Link href="/">Início</Link> / <span>Síndicos profissionais</span>
            </nav>
            <h1>{s.pro_title}</h1>
            <p>{s.pro_text}</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/orcamento?categoria=sindico-profissional" className="btn btn--yellow btn--arrow">
              Pedir proposta
              <span className="btn__dot">
                <Icon name="arrowUpRight" size={16} />
              </span>
            </Link>
            <Link href="/anuncie?perfil=sindico" className="btn btn--glass">
              Sou síndico: quero aparecer
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--first">
        <div className="container">
          <form className="filters" action="/sindicos-profissionais" role="search" style={{ marginTop: 0 }}>
            <div className="filters__search">
              <Icon name="search" />
              <label htmlFor="p-q" className="sr-only">
                Buscar
              </label>
              <input id="p-q" name="q" className="input" placeholder="Nome ou experiência (ex.: residencial, comercial)" defaultValue={q} />
            </div>
            <input name="cidade" className="input input--city" placeholder="Cidade" defaultValue={city} aria-label="Cidade" />
            <button className="btn">Filtrar</button>
          </form>
          <p className="result-count">
            {total} {total === 1 ? "perfil encontrado" : "perfis encontrados"}
          </p>
          {pros.length > 0 ? (
            <div className="sup-grid">
              {pros.map((p, i) => (
                <SupplierCard key={p.id} s={p} rating={rate.get(p.id)} delay={(i % 3) * 0.05} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="users" size={28} />
              <strong>Nenhum perfil com esses filtros.</strong>
              <p>Peça uma proposta: indicamos síndicos profissionais da sua região.</p>
              <Link href="/orcamento?categoria=sindico-profissional" className="btn btn--magenta">
                Pedir proposta
              </Link>
            </div>
          )}
          {pages > 1 && (
            <nav className="pills" style={{ justifyContent: "center", marginTop: 40 }} aria-label="Páginas">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={link(n)} aria-current={n === page}>
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
