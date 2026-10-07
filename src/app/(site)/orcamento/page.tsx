import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "@/components/site/QuoteForm";
import { db } from "@/lib/db";
import { PRO_SLUG, publishedCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Solicitar orçamento grátis",
  description: "Peça orçamentos para o seu condomínio e receba propostas de empresas especializadas. Grátis.",
};

type SP = Promise<{ fornecedor?: string; categoria?: string; servico?: string; cidade?: string }>;

export default async function QuotePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [categories, pro] = await Promise.all([publishedCategories(), db.category.findUnique({ where: { slug: PRO_SLUG } })]);
  const allCats = [...categories, ...(pro ? [pro] : [])];
  const picked = sp.fornecedor ? await db.supplier.findFirst({ where: { slug: sp.fornecedor, published: true }, include: { categories: true } }) : null;
  const category = picked?.categories[0] ?? allCats.find((c) => c.slug === sp.categoria);
  const suppliers = category
    ? await db.supplier.findMany({
        where: { published: true, categories: { some: { id: category.id } } },
        select: { id: true, name: true },
        orderBy: [{ featured: "desc" }, { plan: "desc" }, { order: "asc" }],
        take: 8,
      })
    : [];
  if (picked && !suppliers.some((s) => s.id === picked.id)) suppliers.unshift({ id: picked.id, name: picked.name });

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Solicitar orçamento</span>
          </nav>
          <h1>
            Peça orçamento <span className="serif">sem complicação.</span>
          </h1>
          <p>Cinco passos rápidos. Nossa equipe encaminha o pedido às empresas certas e acompanha até você receber as propostas.</p>
        </div>
      </section>

      <section className="section section--first">
        <div className="container form-layout">
          <div data-reveal>
            <div className="eyebrow">
              <b>Como funciona</b>
            </div>
            <h2 className="h-display" style={{ fontSize: "clamp(26px,3.2vw,40px)" }}>
              Do pedido à proposta, <span className="serif">com acompanhamento.</span>
            </h2>
            <ol className="steps-list">
              <li>
                <div>
                  <strong>Conte o que precisa</strong>
                  <p>Serviço, condomínio, detalhes e prazo. Leva menos de 2 minutos.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Nossa equipe encaminha</strong>
                  <p>Escolhemos empresas da categoria e da sua região — ou as que você indicou.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Receba e compare</strong>
                  <p>As empresas entram em contato. Você decide com calma, sem custo.</p>
                </div>
              </li>
            </ol>
          </div>
          <div className="glass-card glass-card--light" data-reveal style={{ ["--d" as string]: ".1s" }}>
            <QuoteForm
              tone="light"
              categories={allCats.map((c) => ({ name: c.name, icon: c.icon }))}
              suppliers={suppliers}
              preselected={picked ? [picked.id] : []}
              initial={{ category: category?.name, body: sp.servico, city: sp.cidade }}
              source={picked ? `orcamento:${picked.slug}` : "orcamento"}
            />
          </div>
        </div>
      </section>
    </>
  );
}
