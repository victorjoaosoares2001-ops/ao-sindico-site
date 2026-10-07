import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";

/** Página de texto institucional (Privacidade, Termos) editada em Textos do site. */
export function LegalPage({ title, text }: { title: string; text: string }) {
  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>{title}</span>
          </nav>
          <h1>{title}</h1>
        </div>
      </section>
      <section className="section section--first">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="prose" style={{ fontSize: 17 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
          <p style={{ marginTop: 32, fontSize: 14, color: "var(--ink-3)" }}>
            Dúvidas? <Link href="/contato" style={{ textDecoration: "underline" }}>Fale com a gente</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
