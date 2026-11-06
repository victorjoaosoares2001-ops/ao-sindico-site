"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/admin/actions";
import { Icon, type IconName } from "@/components/Icon";
import { Logo } from "@/components/Logo";

type Item = { href: string; label: string; icon: IconName; badge?: number };

/** Grupos que abrem e fecham com a setinha; os que não estão aqui ficam sempre abertos. */
const GROUP_ICONS: Record<string, IconName> = { Comercial: "briefcase", "Conteúdo": "newspaper", Agenda: "calendar", "Configurações": "settings" };

export function AdminShell({
  user,
  groups,
  children,
}: {
  user: { name: string; email: string; roleLabel?: string };
  groups: { title: string; items: Item[] }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));
  const currentGroup = groups.find((g) => GROUP_ICONS[g.title] && g.items.some((it) => active(it.href)))?.title ?? null;
  const [expanded, setExpanded] = useState(currentGroup);
  useEffect(() => {
    setOpen(false);
    if (currentGroup) setExpanded(currentGroup); // ao navegar, abre o grupo da página atual
  }, [pathname, currentGroup]);

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="adm" data-menu={open ? "open" : "closed"}>
      <aside className="adm-side" aria-label="Menu do painel">
        <div className="adm-side__brand">
          <Logo tone="light" />
          <small>Painel da equipe</small>
        </div>
        <nav className="adm-nav">
          {groups.map((g) => {
            const links = g.items.map((it) => (
              <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined}>
                <Icon name={it.icon} />
                {it.label}
                {!!it.badge && <span className="adm-badge">{it.badge}</span>}
              </Link>
            ));
            const icon = GROUP_ICONS[g.title];
            if (!icon) return links; // Dia a dia: sempre à mostra
            const isOpen = expanded === g.title;
            const pending = g.items.reduce((sum, it) => sum + (it.badge ?? 0), 0);
            const panelId = `menu-${icon}`;
            return (
              <div key={g.title} className="adm-nav__group" data-open={isOpen}>
                <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setExpanded(isOpen ? null : g.title)}>
                  <Icon name={icon} />
                  {g.title}
                  {/* com o grupo fechado, o aviso de pendência continua visível */}
                  {!isOpen && pending > 0 && <span className="adm-badge">{pending}</span>}
                  <Icon name="chevronRight" size={16} className="adm-nav__arrow" />
                </button>
                {isOpen && (
                  <div id={panelId} className="adm-nav__items">
                    {links}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="adm-side__foot">
          <a href="/" target="_blank" rel="noopener">
            <Icon name="globe" /> Ver o site
          </a>
          <Link href="/admin/conta">
            <Icon name="key" /> Minha conta e senha
          </Link>
          <div className="adm-user">
            <span className="adm-avatar">{initials}</span>
            <span>
              <b>{user.name}</b>
              {user.roleLabel ?? user.email}
            </span>
          </div>
          <form action={logout}>
            <button>
              <Icon name="logout" /> Sair
            </button>
          </form>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}

      <div style={{ minWidth: 0 }}>
        <div className="adm-top">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Icon name="menu" size={22} />
          </button>
          <Logo compact />
          <Link href="/admin/mensagens" className="icon-btn" aria-label="Mensagens" style={{ position: "relative" }}>
            <Icon name="inbox" size={20} />
            {!!groups[0]?.items.find((i) => i.href === "/admin/mensagens")?.badge && (
              <span style={{ position: "absolute", top: 6, right: 6, width: 9, height: 9, borderRadius: 9, background: "var(--magenta)" }} />
            )}
          </Link>
        </div>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
