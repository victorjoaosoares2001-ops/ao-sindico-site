import Link from "next/link";
import { deleteRegistration } from "@/admin/actions";
import { registrationWhere } from "@/admin/registrations";
import { ConfirmButton } from "@/components/admin/Buttons";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Inscrições" };

const PER_PAGE = 100;

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ evento?: string; tipo?: string; q?: string; pagina?: string }> }) {
  await requireAdmin("agenda");
  const sp = await searchParams;
  const q = sp.q?.trim();
  const where = registrationWhere(sp);
  const page = Math.max(1, Number(sp.pagina) || 1);
  const [regs, total, events, roles] = await Promise.all([
    db.eventRegistration.findMany({ where, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE, include: { event: { select: { title: true } } } }),
    db.eventRegistration.count({ where }),
    db.event.findMany({ where: { registrations: { some: {} } }, orderBy: { startsAt: "desc" }, select: { id: true, title: true, _count: { select: { registrations: true } } } }),
    db.eventRegistration.groupBy({ by: ["role"], where: { role: { not: null } }, orderBy: { role: "asc" } }),
  ]);
  const pages = Math.ceil(total / PER_PAGE);
  const qs = (patch: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ evento: sp.evento, tipo: sp.tipo, q, ...patch })) if (v) p.set(k, v);
    return p.size ? `?${p}` : "";
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Inscrições</h1>
          <p>Toda inscrição feita no site chega aqui na hora. Escolha o evento para imprimir as etiquetas.</p>
        </div>
        <div className="adm-head__actions">
          <a href={`/admin/inscricoes/exportar${qs()}`} className="btn btn--ghost">
            <Icon name="file" /> Exportar inscritos
          </a>
          {sp.evento && (
            <a href={`/admin/inscricoes/etiquetas${qs()}`} target="_blank" rel="noopener" className="btn btn--ghost">
              <Icon name="tag" /> Imprimir etiquetas ({total})
            </a>
          )}
          <Link href="/admin/inscricoes/novo" className="btn btn--magenta">
            <Icon name="plus" /> Adicionar
          </Link>
        </div>
      </div>

      <form action="/admin/inscricoes" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", marginBottom: 14 }}>
        <input name="q" className="input" placeholder="Nome, e-mail, telefone, condomínio…" defaultValue={q} aria-label="Buscar" />
        <select name="evento" className="select" defaultValue={sp.evento ?? ""} aria-label="Evento">
          <option value="">Todos os eventos</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e._count.registrations})
            </option>
          ))}
        </select>
        <select name="tipo" className="select" defaultValue={sp.tipo ?? ""} aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {roles.map((r) => (
            <option key={r.role} value={r.role ?? ""}>
              {r.role}
            </option>
          ))}
        </select>
        <button className="btn">
          <Icon name="search" /> Buscar
        </button>
      </form>
      <p className="hint" style={{ margin: "0 0 10px" }}>
        Total de <strong>{total.toLocaleString("pt-BR")}</strong> registros.
      </p>

      <section className="panel rows">
        {regs.length === 0 ? (
          <div className="adm-empty">
            <Icon name="users" size={30} />
            <strong>Nenhuma inscrição encontrada</strong>
          </div>
        ) : (
          regs.map((r) => (
            <div key={r.id} className="row-item" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <div className="row-main">
                <Link href={`/admin/inscricoes/${r.id}`} className="row-title">
                  {r.name}
                </Link>
                <div className="row-meta">
                  <span>{formatDate(r.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  <span>{r.email}</span>
                  {r.phone && <span>{r.phone}</span>}
                  {r.condo && <span>{r.condo}</span>}
                  {r.role && <span>{r.role}</span>}
                  <span>{r.event.title}</span>
                  <span>Etiqueta: {r.labelCount}x</span>
                </div>
              </div>
              <div className="row-actions">
                <a href={`/admin/inscricoes/etiquetas?id=${r.id}`} target="_blank" rel="noopener" className="icon-btn" title="Gerar etiqueta" aria-label={`Gerar etiqueta de ${r.name}`}>
                  <Icon name="tag" />
                </a>
                <Link href={`/admin/inscricoes/${r.id}`} className="icon-btn" title="Editar" aria-label={`Editar ${r.name}`}>
                  <Icon name="edit" />
                </Link>
                <form action={deleteRegistration.bind(null, r.eventId, r.id)}>
                  <ConfirmButton message={`Remover a inscrição de ${r.name}?`} className="icon-btn icon-btn--danger" icon="trash" title="Remover inscrição" />
                </form>
              </div>
            </div>
          ))
        )}
      </section>
      {pages > 1 && (
        <nav className="tabs" style={{ margin: "18px auto 0", width: "fit-content", maxWidth: "100%" }} aria-label="Páginas">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/admin/inscricoes${qs({ pagina: String(n) })}`} aria-current={n === page}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
