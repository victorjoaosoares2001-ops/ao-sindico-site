import Link from "next/link";
import { deleteRegistration, setReviewStatus, toggleAttendance } from "@/admin/actions";
import { Icon } from "@/components/Icon";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { placementLabel } from "@/lib/placements";
import { ConfirmButton, SubmitButton } from "./Buttons";

function campaignState(c: { published: boolean; startsAt: Date | null; endsAt: Date | null }) {
  const now = new Date();
  if (!c.published) return { label: "Pausado", tone: "off" };
  if (c.startsAt && c.startsAt > now) return { label: `Começa ${formatDate(c.startsAt, { day: "2-digit", month: "short" })}`, tone: "wait" };
  if (c.endsAt && c.endsAt < now) return { label: "Encerrado", tone: "off" };
  return { label: "No ar", tone: "on" };
}

/** Painéis do perfil da empresa: anúncios, avaliações e pedidos de orçamento ligados a ela. */
export async function SupplierPanels({ supplierId }: { supplierId: string }) {
  const [campaigns, reviews, quotes] = await Promise.all([
    db.campaign.findMany({ where: { supplierId }, orderBy: [{ published: "desc" }, { endsAt: "desc" }] }),
    db.review.findMany({ where: { supplierId }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.quoteSupplier.findMany({ where: { supplierId }, include: { message: { select: { id: true, name: true, company: true, createdAt: true, status: true } } }, orderBy: { message: { createdAt: "desc" } }, take: 8 }),
  ]);
  return (
    <div className="related-grid">
      <section className="panel panel__pad">
        <div className="panel__title">
          Anúncios desta empresa ({campaigns.length})
          <Link href={`/admin/anuncios/novo?supplierId=${supplierId}`} className="btn btn--sm btn--magenta">
            <Icon name="plus" size={15} /> Novo anúncio
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="hint">Nenhum anúncio ainda. Clique em “Novo anúncio” para escolher imagem, posição, período e prioridade.</p>
        ) : (
          <div className="mini-list">
            {campaigns.map((c) => {
              const st = campaignState(c);
              return (
                <Link key={c.id} href={`/admin/anuncios/${c.id}`} className="mini-item">
                  <span className="mini-thumb">{c.image ? <img src={c.image} alt="" /> : <Icon name="image" />}</span>
                  <span style={{ minWidth: 0 }}>
                    <strong>{c.title}</strong>
                    <span className="hint">
                      {placementLabel(c.placement)} · {c.clicks} clique(s)
                      {c.endsAt ? ` · até ${formatDate(c.endsAt, { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                    </span>
                  </span>
                  <span className="pill-state" data-tone={st.tone}>
                    {st.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel panel__pad">
        <div className="panel__title">
          Avaliações ({reviews.length})
          <Link href={`/admin/avaliacoes?supplierId=${supplierId}`} className="link-arrow" style={{ fontSize: 14 }}>
            Ver todas <Icon name="arrowRight" size={15} />
          </Link>
        </div>
        {reviews.length === 0 ? (
          <p className="hint">Nenhuma avaliação recebida.</p>
        ) : (
          <div className="mini-list">
            {reviews.map((r) => (
              <div key={r.id} className="mini-item">
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)} · {r.name}
                  </strong>
                  <span className="hint">{r.comment?.slice(0, 120)}</span>
                </span>
                {r.status === "pendente" ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <form action={setReviewStatus.bind(null, r.id, "aprovada")}>
                      <SubmitButton className="btn btn--sm btn--teal" pendingText="…">
                        Aprovar
                      </SubmitButton>
                    </form>
                    <form action={setReviewStatus.bind(null, r.id, "rejeitada")}>
                      <SubmitButton className="btn btn--sm btn--ghost" pendingText="…">
                        Rejeitar
                      </SubmitButton>
                    </form>
                  </span>
                ) : (
                  <span className="pill-state" data-tone={r.status === "aprovada" ? "on" : "off"}>
                    {r.status === "aprovada" ? "Publicada" : "Rejeitada"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel panel__pad">
        <div className="panel__title">Pedidos de orçamento encaminhados ({quotes.length})</div>
        {quotes.length === 0 ? (
          <p className="hint">Nenhum pedido encaminhado para esta empresa.</p>
        ) : (
          <div className="mini-list">
            {quotes.map((q) => (
              <Link key={q.messageId} href={`/admin/mensagens/${q.messageId}`} className="mini-item">
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>{q.message.company ?? q.message.name}</strong>
                  <span className="hint">{formatDateTime(q.message.createdAt)}</span>
                </span>
                <span className="pill-state" data-tone={q.sentAt ? "on" : "wait"}>
                  {q.sentAt ? "Enviado" : "Não enviado"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Inscrições do evento, com presença e exportação. */
export async function EventRegistrations({ eventId }: { eventId: string }) {
  const regs = await db.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
  const present = regs.filter((r) => r.attended).length;
  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="panel__pad" style={{ paddingBottom: 0 }}>
        <div className="panel__title">
          Inscrições ({regs.length}) · presentes: {present}
          {regs.length > 0 && (
            <a href={`/admin/eventos/${eventId}/inscricoes.csv`} className="btn btn--sm btn--ghost">
              <Icon name="file" size={15} /> Baixar planilha (CSV)
            </a>
          )}
        </div>
        <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
          Marque “Presente” depois do evento: só quem estiver marcado consegue baixar o certificado no site.
        </p>
      </div>
      {regs.length === 0 ? (
        <div className="adm-empty">
          <Icon name="users" size={28} />
          <strong>Nenhuma inscrição ainda</strong>A inscrição fica aberta na página pública do evento.
        </div>
      ) : (
        regs.map((r) => (
          <div key={r.id} className="row-item" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
            <div className="row-main">
              <strong>{r.name}</strong>
              <div className="row-meta">
                <span>{r.email}</span>
                {r.phone && <span>{r.phone}</span>}
                {r.role && <span>{r.role}</span>}
                {r.condo && <span>{r.condo}</span>}
                {r.city && <span>{r.city}</span>}
              </div>
            </div>
            <div className="row-actions">
              <form action={toggleAttendance.bind(null, eventId, r.id, !r.attended)}>
                <button className="status-toggle" data-on={r.attended}>
                  <i /> {r.attended ? "Presente" : "Marcar presença"}
                </button>
              </form>
              <form action={deleteRegistration.bind(null, eventId, r.id)}>
                <ConfirmButton message={`Remover a inscrição de ${r.name}?`} className="icon-btn icon-btn--danger" icon="trash" title="Remover inscrição" />
              </form>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
