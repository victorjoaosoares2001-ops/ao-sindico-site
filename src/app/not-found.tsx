import Link from "next/link";
import { Logo } from "@/components/Logo";
import "./(site)/site.css";

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: "100vh", margin: 0, borderRadius: 0, display: "grid", alignItems: "center" }}>
      <div className="container">
        <Link href="/" aria-label="Início">
          <Logo tone="light" />
        </Link>
        <h1 style={{ marginTop: 40 }}>
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
