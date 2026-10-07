import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: "70vh", display: "grid", alignItems: "center" }}>
      <div className="container">
        <h1>
          Página não <span className="serif">encontrada.</span>
        </h1>
        <p>O conteúdo pode ter sido removido ou mudado de endereço.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
          <Link href="/" className="btn btn--yellow">
            Ir para o início
          </Link>
          <Link href="/fornecedores" className="btn btn--glass">
            Ver fornecedores
          </Link>
        </div>
      </div>
    </section>
  );
}
