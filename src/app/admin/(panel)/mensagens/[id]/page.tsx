import Link from "next/link";
import { notFound } from "next/navigation";
import { addContact, deleteMessage, emailQuoteToSupplier, markSupplierSent, setMessageStatus, updateMessage } from "@/admin/actions";
import { EmailSupplierButton } from "@/components/admin/EmailSupplierButton";
import { ConfirmButton, CopyButton, SubmitButton } from "@/components/admin/Buttons";
import { ContactLogForm } from "@/components/admin/ContactLog";
import { History } from "@/components/admin/History";
import { MessageForm } from "@/components/admin/MessageForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, whatsappLink } from "@/lib/format";
import { STATUS_LABEL, TYPE_LABEL } from "../../../messages";
import { buildQuoteText } from "@/admin/quote-text";
import { emailConfigured } from "@/lib/email";

export const metadata = { title: "Pedido" };

const CHANNEL: Record<string, string> = { whatsapp: "WhatsApp", telefone: "Telefone", email: "E-mail", outro: "Outro" };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("mensagens");
  const { id } = await params;
  const m = await db.message.findUnique({
    where: { id },
    include: {
      suppliers: { include: { supplier: { include: { categories: { select: { name: true } } } } } },
      contacts: { orderBy: { createdAt: "desc" }, include: { supplier: { select: { name: true } } } },
    },
  });
  if (!m) notFound();

  const [allSuppliers, team] = await Promise.all([
    db.supplier.findMany({
      where: { published: true },
      select: { id: true, name: true, city: true, featured: true, plan: true, categories: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    db.adminUser.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const isQuote = m.type === "orcamento";
  const where = [m.neighborhood, m.city, m.state].filter(Boolean).join(" · ");
  const facts: [string, string | null][] = [
    ["Telefone", m.phone],
    ["E-mail", m.email],
    ["Quem pediu", m.contactRole],
    [isQuote ? "Condomínio" : "Empresa", m.company],
    ["Tipo", m.condoType],
    ["Unidades", m.units],
    ["Local", where || null],
    ["Serviço", m.category],
    ["Prazo", m.urgency],
    ["Orçamento previsto", m.budget],
    ["Melhor horário", m.preferredTime],
    ["Assunto", isQuote ? null : m.subject],
    ["Recebido em", formatDateTime(m.createdAt)],
    ["Origem", m.source],
    ["Protocolo", m.id.slice(-6).toUpperCase()],
  ];

  const quoteText = (supplierName: string) => buildQuoteText(m, supplierName);
  const canEmail = emailConfigured();

  const replyText = `Olá, ${m.name.split(" ")[0]}! Aqui é da equipe Ao Síndico. Recebemos sua mensagem pelo site${isQuote ? " e já estamos encaminhando seu pedido de orçamento às empresas" : ""}.`;
  const replyWa = whatsappLink(m.phone, replyText);
  const linked = m.suppliers.map((s) => s.supplier);

  // sugestão: mesma categoria; mesma cidade sobe; premium/destaque sobem
  const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const suggestions = isQuote
    ? allSuppliers
        .filter((s) => !linked.some((l) => l.id === s.id) && m.category && s.categories.some((c) => c.name === m.category))
        .map((s) => ({ s, score: (norm(s.city) && norm(s.city) === norm(m.city) ? 4 : 0) + (s.plan === "premium" ? 2 : s.plan === "verificado" ? 1 : 0) + (s.featured ? 1 : 0) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
    : [];

  return (
    <>
      <Link href="/admin/mensagens" className="adm-back">
        <Icon name="arrowLeft" size={15} /> Orçamentos e mensagens
      </Link>
      <div className="adm-head">
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span className="type-chip" data-type={m.type}>
              {TYPE_LABEL[m.type] ?? m.type}
            </span>
            <span className="status-chip" data-status={m.status}>
              {STATUS_LABEL[m.status]}
            </span>
            {m.assignedTo && <span className="chip">Responsável: {m.assignedTo}</span>}
          </div>
          <h1>{m.company && isQuote ? `${m.company} · ${m.name}` : m.name}</h1>
        </div>
        <div className="adm-head__actions">
          {m.status !== "respondido" ? (
            <form action={setMessageStatus.bind(null, m.id, "respondido")}>
              <SubmitButton className="btn btn--teal">
                <Icon name="check" /> Marcar como respondido
              </SubmitButton>
            </form>
          ) : (
            <form action={setMessageStatus.bind(null, m.id, "novo")}>
              <SubmitButton className="btn btn--ghost">Voltar para “Responder”</SubmitButton>
            </form>
          )}
          <form action={deleteMessage.bind(null, m.id)}>
            <ConfirmButton message="Excluir este pedido definitivamente?" className="btn btn--ghost" icon="trash">
              Excluir
            </ConfirmButton>
          </form>
        </div>
      </div>

      <div className="msg-detail">
        <div style={{ display: "grid", gap: 18 }}>
          <section className="panel panel__pad">
            <dl className="facts">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            {m.body && <div className="msg-body">{m.body}</div>}
            <div className="reply-actions">
              {replyWa && (
                <a href={replyWa} target="_blank" rel="noopener" className="btn btn--wa">
                  <Icon name="whatsapp" /> Responder no WhatsApp
                </a>
              )}
              {m.email && (
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Ao Síndico — " + (m.subject ?? "sua mensagem"))}&body=${encodeURIComponent(replyText)}`} className="btn btn--ghost">
                  <Icon name="mail" /> Responder por e-mail
                </a>
              )}
              {m.phone && (
                <a href={`tel:${m.phone.replace(/\D/g, "")}`} className="btn btn--ghost">
                  <Icon name="phone" /> Ligar
                </a>
              )}
            </div>
          </section>

          {isQuote && (
            <section className="panel panel__pad">
              <div className="panel__title">
                Encaminhar às empresas
                <span className="hint">
                  {m.suppliers.filter((s) => s.sentAt).length} de {m.suppliers.length} enviados
                </span>
              </div>
              {m.suppliers.length === 0 ? (
                <p className="hint">Escolha as empresas ao lado (há sugestões abaixo) e salve. Elas aparecem aqui com o texto pronto para enviar.</p>
              ) : (
                <div className="sent-list">
                  {m.suppliers.map(({ supplier: s, sentAt, requested }) => {
                    const text = quoteText(s.name);
                    const wa = whatsappLink(s.whatsapp || s.phone, text);
                    return (
                      <div key={s.id} className="sent-item">
                        <div className="sent-item__head">
                          <div>
                            <strong>
                              <Link href={`/admin/fornecedores/${s.id}`}>{s.name}</Link>
                            </strong>
                            <div className="hint">
                              {s.categories.map((c) => c.name).join(", ")}
                              {requested && " · escolhida pelo síndico"}
                            </div>
                          </div>
                          {sentAt ? (
                            <span className="status-chip" data-status="respondido">
                              <Icon name="check" size={12} /> Enviado {formatDateTime(sentAt)}
                            </span>
                          ) : (
                            <span className="status-chip" data-status="andamento">
                              Não enviado
                            </span>
                          )}
                        </div>
                        <div className="sent-item__actions">
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener" className="btn btn--wa btn--sm">
                              <Icon name="whatsapp" size={15} /> WhatsApp
                            </a>
                          )}
                          {s.email && (
                            <a
                              href={`mailto:${s.email}?subject=${encodeURIComponent("Pedido de orçamento — Ao Síndico")}&body=${encodeURIComponent(text.replace(/\*/g, ""))}`}
                              className="btn btn--ghost btn--sm"
                            >
                              <Icon name="mail" size={15} /> E-mail
                            </a>
                          )}
                          {canEmail && s.email && <EmailSupplierButton action={emailQuoteToSupplier.bind(null, m.id, s.id)} />}
                          <CopyButton text={text} label="Copiar texto" />
                          <form action={markSupplierSent.bind(null, m.id, s.id, !sentAt)}>
                            <SubmitButton className="btn btn--ghost btn--sm" pendingText="…">
                              {sentAt ? "Desmarcar" : "Marcar como enviado"}
                            </SubmitButton>
                          </form>
                        </div>
                        {!wa && !s.email && <span className="hint">Sem WhatsApp nem e-mail cadastrado — use “Copiar texto” ou complete o cadastro da empresa.</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {suggestions.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div className="label" style={{ marginBottom: 8 }}>
                    Sugestões para “{m.category}”
                  </div>
                  <div className="suggest">
                    {suggestions.map(({ s }) => (
                      <span key={s.id} className="chip">
                        {s.name}
                        {s.city ? ` · ${s.city}` : ""}
                      </span>
                    ))}
                  </div>
                  <p className="hint" style={{ marginTop: 6 }}>
                    Marque as que quiser em “Empresas relacionadas” e salve.
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="panel panel__pad">
            <div className="panel__title">Contatos realizados ({m.contacts.length})</div>
            <ContactLogForm action={addContact.bind(null, m.id)} suppliers={linked.map((s) => ({ id: s.id, name: s.name }))} />
            {m.contacts.length > 0 && (
              <ol className="timeline" style={{ marginTop: 16 }}>
                {m.contacts.map((c) => (
                  <li key={c.id}>
                    <span className="timeline__dot" />
                    <div>
                      <strong>{c.userName}</strong> · {CHANNEL[c.channel] ?? c.channel} {c.supplier ? `com ${c.supplier.name}` : "com o solicitante"}
                      {c.note && <div style={{ marginTop: 2 }}>{c.note}</div>}
                      <div className="hint">{formatDateTime(c.createdAt)}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panel panel__pad">
            <div className="panel__title">Histórico da operação</div>
            <History entity="mensagens" entityId={m.id} take={30} />
          </section>
        </div>

        <MessageForm
          action={updateMessage.bind(null, m.id)}
          status={m.status}
          notes={m.notes ?? ""}
          assignedTo={m.assignedTo ?? ""}
          team={team.map((t) => t.name)}
          isQuote={isQuote}
          category={m.category}
          city={m.city}
          selected={m.suppliers.map((s) => s.supplierId)}
          suppliers={allSuppliers.map((s) => ({ id: s.id, name: s.name, city: s.city, categories: s.categories.map((c) => c.name) }))}
        />
      </div>
    </>
  );
}
