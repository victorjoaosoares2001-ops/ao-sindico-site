import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ContactForm } from "@/components/site/Forms";
import { whatsappLink } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Anuncie para síndicos",
  description: "Anuncie sua empresa para síndicos e gestores de condomínios no portal Ao Síndico.",
};

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ contato?: string }> }) {
  const { contato } = await searchParams;
  const s = await getSettings();
  const isContact = contato === "1";
  const wa = whatsappLink(s.whatsapp, isContact ? "Olá! Vim pelo site Ao Síndico." : "Olá! Tenho interesse em anunciar no Ao Síndico.");

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>{isContact ? "Fale conosco" : "Anuncie"}</span>
          </nav>
          {isContact ? (
            <h1>
              Fale com a <span className="serif">equipe Ao Síndico.</span>
            </h1>
          ) : (
            <h1>{s.advertise_title}</h1>
          )}
          <p>{isContact ? "Dúvidas, sugestões ou parcerias — responderemos em até 1 dia útil." : s.advertise_text}</p>
        </div>
      </section>

      <section className="section">
        <div className="container form-layout">
          <div data-reveal>
            {!isContact && (
              <>
                <div className="eyebrow">
                  <b>Formatos</b>
                </div>
                <h2 className="h-display" style={{ fontSize: "clamp(28px,3.6vw,44px)" }}>
                  Visibilidade <span className="serif">sob medida.</span>
                </h2>
                <ul className="cta__list" style={{ marginTop: 28 }}>
                  {[
                    ["building", "Perfil no guia de fornecedores, com selo Verificado ou Premium"],
                    ["megaphone", "Banners na página inicial, nas matérias e no guia"],
                    ["inbox", "Pedidos de orçamento encaminhados pela nossa equipe"],
                    ["users", "Patrocínio dos Encontros de Síndicos"],
                    ["newspaper", "Matérias patrocinadas e coluna própria"],
                  ].map(([icon, text]) => (
                    <li key={text} style={{ background: "#fff", boxShadow: "inset 0 0 0 1px var(--line)" }}>
                      <Icon name={icon} style={{ color: "var(--magenta)" }} /> {text}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="btn btn--ghost" style={{ marginTop: 28 }}>
                <Icon name="whatsapp" /> Prefere WhatsApp? {s.whatsapp}
              </a>
            )}
          </div>
          <div className="card" data-reveal style={{ ["--d" as string]: ".1s" }}>
            <h2 style={{ fontSize: 26 }}>{isContact ? "Envie sua mensagem" : "Fale com o comercial"}</h2>
            <p style={{ color: "var(--ink-3)", margin: "-6px 0 22px", fontSize: 15 }}>Campos com * são obrigatórios.</p>
            <ContactForm type={isContact ? "contato" : "anunciar"} source={isContact ? "contato" : "anuncie"} />
          </div>
        </div>
      </section>
    </>
  );
}
