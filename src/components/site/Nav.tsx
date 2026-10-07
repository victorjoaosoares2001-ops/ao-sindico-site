"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

const MAIN = [
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/sindicos-profissionais", label: "Síndicos profissionais" },
  { href: "/informe-se", label: "Informe-se" },
  { href: "/tira-duvidas", label: "Tira-Dúvidas" },
  { href: "/eventos", label: "Eventos" },
  { href: "/videos", label: "Vídeos" },
];

const UTIL = [
  { href: "/cursos", label: "Cursos" },
  { href: "/colunistas", label: "Colunistas" },
  { href: "/parceiros", label: "Parceiros" },
];

/** Barra utilitária + barra principal de vidro. Sobre o topo escuro fica transparente; ao rolar, vira vidro claro. */
export function Nav({ whatsappHref, hidden = [] }: { whatsappHref: string | null; hidden?: string[] }) {
  const show = (l: { href: string }) => !hidden.includes(l.href);
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open || search ? "hidden" : "";
    if (search) setTimeout(() => searchRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch(false);
      }
      if (e.key === "/" && !open && !search && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, search]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const go = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (q) router.push(`/busca?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className={`nav${scrolled ? " nav--scrolled" : " nav--top"}`}>
        <div className="nav__util container" aria-label="Acesso rápido">
          <ul>
            {UTIL.filter(show).map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
            {whatsappHref && (
              <li>
                <a href={whatsappHref} target="_blank" rel="noopener">
                  <Icon name="whatsapp" size={14} /> WhatsApp
                </a>
              </li>
            )}
          </ul>
          <ul>
            <li>
              <Link href="/anuncie" className="nav__util-strong">
                <Icon name="megaphone" size={14} /> Anuncie
              </Link>
            </li>
            <li>
              <Link href="/admin" className="nav__util-strong">
                <Icon name="users" size={14} /> Entrar
              </Link>
            </li>
          </ul>
        </div>
        <div className="container">
          <nav className="nav__bar" aria-label="Principal">
            <Link href="/" aria-label="Início">
              <Logo />
            </Link>
            <ul className="nav__links">
              {MAIN.filter(show).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="nav__cta">
              <button className="nav__icon" aria-label="Buscar no portal" onClick={() => setSearch(true)}>
                <Icon name="search" size={19} />
              </button>
              <Link href="/orcamento" className={`btn btn--arrow nav__quote ${scrolled ? "" : "btn--yellow"}`}>
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

      {/* Busca global */}
      <div className="search-overlay" data-open={search} role="dialog" aria-modal="true" aria-label="Buscar" aria-hidden={!search} onClick={(e) => e.target === e.currentTarget && setSearch(false)}>
        <form className="search-overlay__box" onSubmit={go} role="search">
          <Icon name="search" size={22} />
          <input ref={searchRef} name="q" placeholder="Buscar empresas, serviços, matérias, dúvidas…" aria-label="Termo de busca" autoComplete="off" />
          <button className="btn btn--yellow btn--sm">Buscar</button>
          <button type="button" className="nav__icon" aria-label="Fechar busca" onClick={() => setSearch(false)}>
            <Icon name="x" size={18} />
          </button>
        </form>
        <div className="search-overlay__hints">
          {["Portaria", "Pintura predial", "Impermeabilização", "Síndico profissional", "Assembleia", "Inadimplência"].map((s) => (
            <Link key={s} href={`/busca?q=${encodeURIComponent(s)}`}>
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Menu do celular */}
      <div className="sheet" data-open={open} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <div className="sheet__head">
          <Logo tone="light" />
          <button className="nav__toggle" style={{ display: "grid", color: "#fff", background: "rgba(255,255,255,.1)" }} aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <form className="sheet__search" onSubmit={go} role="search">
          <Icon name="search" size={18} />
          <input name="q" placeholder="Buscar no portal" aria-label="Buscar no portal" />
        </form>
        <ul className="sheet__links">
          {[{ href: "/", label: "Início" }, ...MAIN, ...UTIL, { href: "/contato", label: "Contato" }].filter(show).map((l) => (
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Link href="/anuncie" className="btn btn--glass btn--block">
              <Icon name="megaphone" size={16} /> Anuncie
            </Link>
            <Link href="/admin" className="btn btn--glass btn--block">
              <Icon name="users" size={16} /> Entrar
            </Link>
          </div>
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
