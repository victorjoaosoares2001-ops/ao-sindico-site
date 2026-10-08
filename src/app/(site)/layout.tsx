import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { MobileBar, RevealObserver } from "@/components/site/Client";
import { NewsletterForm } from "@/components/site/Forms";
import { Nav } from "@/components/site/Nav";
import { whatsappLink } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { isAvailable, sectionAvailability } from "@/lib/sections";
import "./site.css";

// Renderiza a cada visita: o que a equipe salva no painel aparece no próximo carregamento,
// e anúncios saem do ar exatamente na data final.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, open] = await Promise.all([getSettings(), sectionAvailability()]);
  const hidden = Object.keys(open).filter((k) => !open[k]);
  const portal = [
    ["/fornecedores", "Fornecedores"],
    ["/sindicos-profissionais", "Síndicos profissionais"],
    ["/informe-se", "Informe-se"],
    ["/tira-duvidas", "Tira-Dúvidas"],
    ["/colunistas", "Colunistas"],
    ["/videos", "Vídeos"],
    ["/eventos", "Eventos"],
    ["/cursos", "Cursos"],
  ].filter(([href]) => isAvailable(open, href));
  const company = [
    ["/orcamento", "Solicitar orçamento"],
    ["/anuncie", "Anuncie"],
    ["/parceiros", "Parceiros"],
    ["/contato", "Contato"],
    ["/busca", "Buscar no portal"],
  ].filter(([href]) => isAvailable(open, href));
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site Ao Síndico e gostaria de mais informações.");
  const socials = (
    [
      ["instagram", s.instagram],
      ["facebook", s.facebook],
      ["linkedin", s.linkedin],
      ["youtube", s.youtube],
    ] as [IconName, string][]
  ).filter(([, url]) => url);

  return (
    <>
      <Nav whatsappHref={wa} hidden={hidden} />
      <main>{children}</main>

      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__about">
              <div className="footer__brand">
                <img src="/logo-full-dark.png" alt="Ao Síndico — Atender, Informar, Inovar" />
              </div>
              <p>{s.about_text}</p>
              <div style={{ maxWidth: 380 }}>
                <p style={{ margin: "0 0 10px", fontSize: 14, color: "rgba(255,255,255,.55)" }}>Receba novidades no seu e-mail</p>
                <NewsletterForm />
              </div>
            </div>
            <div>
              <h4>Portal</h4>
              <ul>
                {portal.map(([href, label]) => (<li key={href}><Link href={href}>{label}</Link></li>))}

              </ul>
            </div>
            <div>
              <h4>Ao Síndico</h4>
              <ul>
                {company.map(([href, label]) => (<li key={href}><Link href={href}>{label}</Link></li>))}

              </ul>
            </div>
            <div>
              <h4>Contato</h4>
              <ul>
                {wa && (
                  <li>
                    <a href={wa} target="_blank" rel="noopener">{s.whatsapp}</a>
                  </li>
                )}
                {s.phone && <li><a href={`tel:${s.phone.replace(/\D/g, "")}`}>{s.phone}</a></li>}
                {s.email && <li><a href={`mailto:${s.email}`}>{s.email}</a></li>}
                {s.address && <li>{s.address}</li>}
              </ul>
              {socials.length > 0 && (
                <div className="socials" style={{ marginTop: 18 }}>
                  {socials.map(([icon, url]) => (
                    <a key={icon} href={url} target="_blank" rel="noopener" aria-label={icon}>
                      <Icon name={icon} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="footer__bottom">
            <span>© {new Date().getFullYear()} Ao Síndico. Todos os direitos reservados.</span>
            <span style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/privacidade">Privacidade</Link>
              <Link href="/termos">Termos de uso</Link>
              <Link href="/admin">Entrar · área da equipe</Link>
            </span>
          </div>
          <div className="footer__giant" aria-hidden="true">
            AoSindico.com
          </div>
        </div>
      </footer>

      {wa && (
        <a href={wa} className="wa-float" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
          <Icon name="whatsapp" size={28} />
        </a>
      )}
      <MobileBar whatsappHref={wa} />
      <RevealObserver />
    </>
  );
}
