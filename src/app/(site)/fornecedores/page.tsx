import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { SupplierCard } from "@/components/site/Cards";
import { db } from "@/lib/db";
import { activeCampaigns, publishedCategories, supplierCardInclude } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Fornecedores para condomínios",
  description: "Guia de empresas e síndicos profissionais para condomínios. Compare e solicite orçamentos grátis.",
};

const PER_PAGE = 18;

type SP = Promise<{ q?: string; categoria?: string; cidade?: string; ordem?: string; pagina?: string }>;

export default async function SuppliersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const city = sp.cidade?.trim() ?? "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  const categories = await publishedCategories();
  const current = categories.find((c) => c.slug === sp.categoria);

  const where: Prisma.SupplierWhereInput = {
    published: true,
    ...(current ? { categories: { some: { id: current.id } } } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { services: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }] }
      : {}),
  };
  const orderBy: Prisma.SupplierOrderByWithRelationInput[] =
    sp.ordem === "az" ? [{ name: "asc" }] : [{ featured: "desc" }, { plan: "desc" }, { order: "asc" }, { name: "asc" }];

  const [total, suppliers, ads] = await Promise.all([
    db.supplier.count({ where }),
    db.supplier.findMany({ where, include: supplierCardInclude, orderBy, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    activeCampaigns("fornecedores", 1),
  ]);
  const pages = Math.ceil(total / PER_PAGE);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, categoria: sp.categoria, cidade: city, ordem: sp.ordem, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/fornecedores?${s}` : "/fornecedores";
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Fornecedores</span>
          </nav>
          <h1>
            {current ? current.name : "Guia de fornecedores"} <span className="serif">{current ? "para condomínios." : "para o seu condomínio."}</span>
          </h1>
          <p>{current?.description ?? "Empresas especializadas no mercado condominial. Escolha, compare e peça orçamento grátis."}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <form className="filters" action="/fornecedores" role="search">
            <div className="filters__search">
              <Icon name="search" />
              <label htmlFor="f-q" className="sr-only">
                Buscar
              </label>
              <input id="f-q" name="q" className="input" placeholder="Empresa ou serviço" defaultValue={q} />
            </div>
            <label className="sr-only" htmlFor="f-cat">
              Categoria
            </label>
            <select id="f-cat" name="categoria" className="select" defaultValue={sp.categoria ?? ""}>
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="f-city">
              Cidade
            </label>
            <input id="f-city" name="cidade" className="input input--city" placeholder="Cidade" defaultValue={city} />
            <button className="btn">Filtrar</button>
          </form>

          <div className="pills" aria-label="Categorias">
            <Link href={qs({ categoria: undefined, pagina: undefined })} aria-current={!current}>
              Todas
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={qs({ categoria: c.slug, pagina: undefined })} aria-current={current?.id === c.id}>
                {c.name}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <p className="result-count">
              {total} {total === 1 ? "empresa encontrada" : "empresas encontradas"}
            </p>
            <p className="result-count">
              Ordenar:{" "}
              <Link href={qs({ ordem: undefined })} style={{ fontWeight: sp.ordem === "az" ? 400 : 700 }}>
                Destaques
              </Link>{" "}
              ·{" "}
              <Link href={qs({ ordem: "az" })} style={{ fontWeight: sp.ordem === "az" ? 700 : 400 }}>
                A–Z
              </Link>
            </p>
          </div>

          {ads[0]?.image && (
            <a href={ads[0].link ?? "#"} className="ad" style={{ display: "block", marginBottom: 24, aspectRatio: "auto" }} target="_blank" rel="noopener sponsored">
              <img src={ads[0].image} alt={ads[0].title} loading="lazy" />
              <span className="chip chip--glass ad__label">Publicidade</span>
            </a>
          )}

          {suppliers.length > 0 ? (
            <div className="sup-grid">
              {suppliers.map((s, i) => (
                <SupplierCard key={s.id} s={s} delay={(i % 3) * 0.05} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="search" size={28} />
              <strong>Nenhuma empresa encontrada com esses filtros.</strong>
              <p>Peça um orçamento mesmo assim — nossa equipe encontra o fornecedor certo para você.</p>
              <Link href="/orcamento" className="btn btn--magenta">
                Pedir orçamento
              </Link>
            </div>
          )}

          {pages > 1 && (
            <nav className="pills" style={{ justifyContent: "center", marginTop: 40 }} aria-label="Páginas">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={qs({ pagina: String(n) })} aria-current={n === page}>
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
