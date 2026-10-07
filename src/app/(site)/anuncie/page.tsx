import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ContactForm } from "@/components/site/Forms";
import { whatsappLink } from "@/lib/format";
import { portalNumbers, PRO_SLUG } from "@/lib/queries";
import { getSettings, lines } from "@/lib/settings";
import { PLACEMENTS } from "@/lib/placements";

export const metadata: Metadata = {
  title: "Anuncie para síndicos",
  description: "Anuncie sua empresa para síndicos e gestores de condomínios no portal Ao Síndico.",
};

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ contato?: string; perfil?: string }> }) {
  const sp = await searchParams;
  if (sp.contato === "1") redirect("/contato"); // endereço antigo do Fale conosco
  const [s, numbers] = await Promise.all([getSettings(), portalNumbers()]);
  const isContact = sp.contato === "1";
  const isPro = sp.perfil === "sindico";
  const formats = lines(s.advertise_formats);
  const wa = whatsappLink(s.whatsapp, isContact ? "Olá! Vim pelo site Ao Síndico." : "Olá! Tenho interesse em anunciar no Ao Síndico.");
  const interests = isPro ? ["Quero meu perfil de síndico profissional no portal", ...formats] : formats;

  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>{isContact ? "Fale conosco" : "Anuncie"}</span>
          </nav>
          <h1>{isContact ? "Fale com a equipe Ao Síndico." : isPro ? "Síndico profissional: apareça para quem procura." : s.advertise_title}</h1>
          <p>{isContact ? "Dúvidas, sugestões ou parcerias — responderemos em até 1 dia útil." : s.advertise_text}</p>
        </div>
      </section>

      <section className="section section--first">
        <div className="container form-layout">
          <div data-reveal>
            {!isContact && (
              <>
                <div className="eyebrow">
                  <b>Como funciona</b>
                </div>
                <ol className="steps-list" style={{ marginTop: 0 }}>
                  <li>
                    <div>
                      <strong>Você fala com o comercial</strong>
                      <p>Pelo formulário ou WhatsApp. Entendemos seu público e sua região.</p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Montamos o seu espaço</strong>
                      <p>Perfil completo no guia, banners nas posições escolhidas e período definido.</p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Sua empresa no ar</strong>
                      <p>Pedidos de orçamento e cliques nos banners acompanhados pela nossa equipe.</p>
                    </div>
                  </li>
                </ol>
                {formats.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 20, margin: "34px 0 14px" }}>Formatos</h2>
                    <ul className="cta__list">
                      {formats.map((f) => (
                        <li key={f} style={{ background: "#fff", boxShadow: "inset 0 0 0 1px var(--line)" }}>
                          <Icon name="check" style={{ color: "var(--magenta)" }} /> {f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <h2 style={{ fontSize: 20, margin: "34px 0 14px" }}>Onde os banners aparecem</h2>
                <div className="dense-list">
                  {PLACEMENTS.map((p) => (
                    <div key={p.value} className="dense-item" style={{ padding: "12px 0" }}>
                      <span style={{ fontWeight: 600 }}>{p.label}</span>
                      <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{p.size}</span>
                    </div>
                  ))}
                </div>
                {(numbers.suppliers > 0 || numbers.articles > 0) && (
                  <p style={{ marginTop: 22, fontSize: 14, color: "var(--ink-3)" }}>
                    Hoje o portal reúne {numbers.suppliers} empresas no guia{numbers.pros ? `, ${numbers.pros} síndicos profissionais` : ""} e {numbers.articles} matérias publicadas.
                  </p>
                )}
              </>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="btn btn--ghost" style={{ marginTop: 24 }}>
                <Icon name="whatsapp" /> Prefere WhatsApp? {s.whatsapp}
              </a>
            )}
            {isPro && (
              <p style={{ marginTop: 18 }}>
                <Link href="/sindicos-profissionais" className="link-arrow">
                  Ver perfis de síndicos profissionais <Icon name="arrowUpRight" size={15} />
                </Link>
              </p>
            )}
          </div>
          <div className="card" data-reveal style={{ ["--d" as string]: ".1s" }} id="formulario">
            <h2 style={{ fontSize: 26 }}>{isContact ? "Envie sua mensagem" : "Fale com o comercial"}</h2>
            <p style={{ color: "var(--ink-3)", margin: "-6px 0 22px", fontSize: 15 }}>Campos com * são obrigatórios. Retorno em até 1 dia útil.</p>
            <ContactForm type={isContact ? "contato" : "anunciar"} source={isContact ? "contato" : isPro ? `anuncie:${PRO_SLUG}` : "anuncie"} interests={interests} />
          </div>
        </div>
      </section>
    </>
  );
}
