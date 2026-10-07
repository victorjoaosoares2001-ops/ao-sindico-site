"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/informe-se", label: "Informe-se" },
  { href: "/eventos", label: "Eventos" },
  { href: "/cursos", label: "Cursos" },
  { href: "/parceiros", label: "Parceiros" },
  { href: "/anuncie", label: "Anuncie" },
];

/** Barra flutuante de vidro. Sobre o topo escuro fica transparente; ao rolar, vira vidro claro. */
export function Nav({ whatsappHref }: { whatsappHref: string | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className={`nav${scrolled ? "" : " nav--top"}`}>
        <div className="container">
          <nav className="nav__bar" aria-label="Principal">
            <Link href="/" aria-label="Início">
              <Logo />
            </Link>
            <ul className="nav__links">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="nav__cta">
              <Link href="/orcamento" className={`btn btn--arrow ${scrolled ? "" : "btn--yellow"}`}>
                Solicitar orçamento
                <span className="btn__dot">
                  <Icon name="arrowUpRight" size={16} />
                </span>
              </Link>
              <button className="nav__toggle" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)}>
                <Icon name="menu" size={20} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="sheet" data-open={open} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <div className="sheet__head">
          <Logo tone="light" />
          <button className="nav__toggle" style={{ display: "grid", color: "#fff", background: "rgba(255,255,255,.1)" }} aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <ul className="sheet__links">
          <li>
            <Link href="/">
              Início <Icon name="arrowRight" />
            </Link>
          </li>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                {l.label} <Icon name="arrowRight" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="sheet__actions">
          <Link href="/orcamento" className="btn btn--yellow btn--block">
            Solicitar orçamento grátis
          </Link>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener" className="btn btn--glass btn--block">
              <Icon name="whatsapp" /> Falar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  );
}
