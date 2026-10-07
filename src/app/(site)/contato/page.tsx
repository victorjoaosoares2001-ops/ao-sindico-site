import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ContactForm } from "@/components/site/Forms";
import { whatsappLink } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contato", description: "Fale com a equipe do portal Ao Síndico." };

export default async function ContactPage() {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site Ao Síndico.");
  const channels = [
    wa && { icon: "whatsapp", label: s.whatsapp, href: wa },
    s.phone && { icon: "phone", label: s.phone, href: `tel:${s.phone.replace(/\D/g, "")}` },
    s.email && { icon: "mail", label: s.email, href: `mailto:${s.email}` },
    s.instagram && { icon: "instagram", label: "Instagram", href: s.instagram },
    s.address && { icon: "mapPin", label: s.address, href: null },
  ].filter(Boolean) as { icon: string; label: string; href: string | null }[];

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Contato</span>
          </nav>
          <h1>Fale com a equipe Ao Síndico</h1>
          <p>{s.contact_text}</p>
        </div>
      </section>
      <section className="section section--first">
        <div className="container form-layout">
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 14 }}>Canais</h2>
            <ul className="contact-list">
              {channels.map((c) => (
                <li key={c.label}>
                  {c.href ? (
                    <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener">
                      <Icon name={c.icon} /> {c.label}
                    </a>
                  ) : (
                    <span>
                      <Icon name={c.icon} /> {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 22, fontSize: 15, color: "var(--ink-2)" }}>
              Precisa de orçamento? <Link href="/orcamento" style={{ textDecoration: "underline" }}>Peça aqui</Link>. Quer anunciar?{" "}
              <Link href="/anuncie" style={{ textDecoration: "underline" }}>Fale com o comercial</Link>.
            </p>
          </div>
          <div className="card">
            <h2 style={{ fontSize: 24 }}>Envie sua mensagem</h2>
            <p style={{ color: "var(--ink-3)", margin: "-6px 0 20px", fontSize: 15 }}>Campos com * são obrigatórios.</p>
            <ContactForm type="contato" source="contato" />
          </div>
        </div>
      </section>
    </>
  );
}
