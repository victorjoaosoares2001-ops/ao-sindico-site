import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Inscrições de eventos" };

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ evento?: string; q?: string }> }) {
  await requireAdmin("agenda");
  const sp = await searchParams;
  const q = sp.q?.trim();
  const events = await db.event.findMany({
    where: { registrations: { some: {} } },
    orderBy: { startsAt: "desc" },
    select: { id: true, title: true, _count: { select: { registrations: true } } },
  });
  const current = events.find((e) => e.id === sp.evento) ?? (events.length === 1 ? events[0] : undefined);
  const where: Prisma.EventRegistrationWhereInput = {
    ...(current ? { eventId: current.id } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }, { condo: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const regs = await db.eventRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { event: { select: { id: true, title: true } } },
  });

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Inscrições de eventos</h1>
          <p>Toda inscrição feita no site chega aqui na hora, da mais nova para a mais antiga.</p>
        </div>
        {current && (
          <div className="adm-head__actions">
            <a href={`/admin/eventos/${current.id}/inscricoes.csv`} className="btn btn--ghost">
              <Icon name="file" /> Baixar planilha
            </a>
          </div>
        )}
      </div>

      <form className="toolbar" action="/admin/inscricoes">
        {sp.evento && <input type="hidden" name="evento" value={sp.evento} />}
        <div className="search">
          <Icon name="search" />
          <input name="q" className="input" placeholder="Buscar por nome, e-mail, WhatsApp, condomínio…" defaultValue={q} aria-label="Buscar" />
        </div>
      </form>
      {events.length > 1 && (
        <nav className="tabs" style={{ marginBottom: 14, width: "fit-content", maxWidth: "100%" }} aria-label="Evento">
          <Link href="/admin/inscricoes" aria-current={!current}>
            Todos
          </Link>
          {events.map((e) => (
            <Link key={e.id} href={`/admin/inscricoes?evento=${e.id}`} aria-current={current?.id === e.id}>
              {e.title} <span className="count">{e._count.registrations}</span>
            </Link>
          ))}
        </nav>
      )}

      <section className="panel">
        {regs.length === 0 ? (
          <div className="adm-empty">
            <Icon name="users" size={30} />
            <strong>Nenhuma inscrição encontrada</strong>As inscrições feitas na página do evento aparecem aqui.
          </div>
        ) : (
          regs.map((r) => (
            <Link key={r.id} href={`/admin/eventos/${r.event.id}`} className="msg-row" title="Abrir o evento para marcar presença">
              <span className="msg-dot" />
              <span style={{ minWidth: 0 }}>
                <span className="msg-row__top">
                  <span className="msg-row__name">{r.name}</span>
                  {r.phone && (
                    <span className="hint" style={{ color: "#128C7E", fontWeight: 600 }}>
                      <Icon name="whatsapp" size={12} style={{ display: "inline", verticalAlign: -1 }} /> {r.phone}
                    </span>
                  )}
                </span>
                <span className="msg-row__text">{[r.email, r.role, r.condo, r.city, r.units ? `${r.units} unidades` : null, r.event.title].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="msg-row__date">{formatDateTime(r.createdAt)}</span>
            </Link>
          ))
        )}
      </section>
    </>
  );
}
