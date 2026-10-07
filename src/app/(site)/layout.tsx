import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { MobileBar, RevealObserver } from "@/components/site/Client";
import { NewsletterForm } from "@/components/site/Forms";
import { Nav } from "@/components/site/Nav";
import { whatsappLink } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import "./site.css";

// Renderiza a cada visita: o que a equipe salva no painel aparece no próximo carregamento,
// e anúncios saem do ar exatamente na data final.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
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
      <Nav whatsappHref={wa} />
      <main>{children}</main>

      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__about">
              <Logo tone="light" />
              <p>{s.about_text}</p>
              <div style={{ maxWidth: 380 }}>
                <p style={{ margin: "0 0 10px", fontSize: 14, color: "rgba(255,255,255,.55)" }}>Receba novidades no seu e-mail</p>
                <NewsletterForm />
              </div>
            </div>
            <div>
              <h4>Portal</h4>
              <ul>
                <li><Link href="/fornecedores">Fornecedores</Link></li>
                <li><Link href="/fornecedores?categoria=sindico-profissional">Síndicos profissionais</Link></li>
                <li><Link href="/informe-se">Informe-se</Link></li>
                <li><Link href="/eventos">Eventos</Link></li>
                <li><Link href="/cursos">Cursos</Link></li>
              </ul>
            </div>
            <div>
              <h4>Ao Síndico</h4>
              <ul>
                <li><Link href="/orcamento">Solicitar orçamento</Link></li>
                <li><Link href="/anuncie">Anuncie</Link></li>
                <li><Link href="/parceiros">Parceiros</Link></li>
                <li><Link href="/anuncie?contato=1">Fale conosco</Link></li>
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
            <Link href="/admin">Área da equipe</Link>
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
