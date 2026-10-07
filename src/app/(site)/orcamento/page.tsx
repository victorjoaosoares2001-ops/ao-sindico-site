import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "@/components/site/QuoteForm";
import { db } from "@/lib/db";
import { publishedCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Solicitar orçamento grátis",
  description: "Peça orçamentos para o seu condomínio e receba propostas das melhores empresas. Grátis, prático e seguro.",
};

type SP = Promise<{ fornecedor?: string; categoria?: string; servico?: string; cidade?: string }>;

export default async function QuotePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const categories = await publishedCategories();
  const picked = sp.fornecedor
    ? await db.supplier.findFirst({ where: { slug: sp.fornecedor, published: true }, include: { categories: true } })
    : null;
  const category = picked?.categories[0] ?? categories.find((c) => c.slug === sp.categoria);
  const suppliers = category
    ? await db.supplier.findMany({
        where: { published: true, categories: { some: { id: category.id } } },
        select: { id: true, name: true },
        orderBy: [{ featured: "desc" }, { order: "asc" }],
        take: 8,
      })
    : picked
      ? [{ id: picked.id, name: picked.name }]
      : [];
  if (picked && !suppliers.some((s) => s.id === picked.id)) suppliers.unshift({ id: picked.id, name: picked.name });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Solicitar orçamento</span>
          </nav>
          <h1>
            Peça orçamento <span className="serif">sem complicação.</span>
          </h1>
          <p>Conte o que o condomínio precisa. Nossa equipe encaminha o pedido às empresas certas e você recebe as propostas.</p>
        </div>
      </section>

      <section className="section">
        <div className="container form-layout">
          <div data-reveal>
            <div className="eyebrow">
              <b>Como funciona</b>
            </div>
            <h2 className="h-display" style={{ fontSize: "clamp(28px,3.6vw,44px)" }}>
              Três passos, <span className="serif">zero custo.</span>
            </h2>
            <ol className="steps-list">
              <li>
                <div>
                  <strong>Descreva o serviço</strong>
                  <p>Escolha a categoria e explique o que precisa — quanto mais detalhe, melhor o orçamento.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Nós encaminhamos</strong>
                  <p>A equipe Ao Síndico envia seu pedido para empresas qualificadas da sua região.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Receba e compare</strong>
                  <p>As empresas entram em contato com propostas. Você escolhe com tranquilidade.</p>
                </div>
              </li>
            </ol>
          </div>
          <div className="glass-card glass-card--light" data-reveal style={{ ["--d" as string]: ".1s" }}>
            <QuoteForm
              tone="light"
              categories={categories.map((c) => c.name)}
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
