import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMessage, markSupplierSent, setMessageStatus, updateMessage } from "@/admin/actions";
import { ConfirmButton, CopyButton, SubmitButton } from "@/components/admin/Buttons";
import { MessageForm } from "@/components/admin/MessageForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, whatsappLink } from "@/lib/format";
import { STATUS_LABEL, TYPE_LABEL } from "../../../messages";

export const metadata = { title: "Mensagem" };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const m = await db.message.findUnique({
    where: { id },
    include: { suppliers: { include: { supplier: { include: { categories: { select: { name: true } } } } } } },
  });
  if (!m) notFound();

  const allSuppliers = await db.supplier.findMany({
    select: { id: true, name: true, city: true, categories: { select: { name: true } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

  const isQuote = m.type === "orcamento";
  const facts: [string, string | null][] = [
    ["Telefone", m.phone],
    ["E-mail", m.email],
    [isQuote ? "Condomínio" : "Empresa", m.company],
    ["Cidade", m.city],
    ["Categoria", m.category],
    ["Unidades", m.units],
    ["Prazo", m.urgency],
    ["Assunto", m.subject],
    ["Recebida em", formatDateTime(m.createdAt)],
    ["Origem", m.source],
  ];

  const quoteText = (supplierName: string) =>
    [
      `Olá, ${supplierName}! Aqui é da equipe Ao Síndico.`,
      `Recebemos um pedido de orçamento que combina com a sua empresa:`,
      ``,
      m.category && `*Serviço:* ${m.category}`,
      m.body && `*Descrição:* ${m.body}`,
      m.company && `*Condomínio:* ${m.company}${m.units ? ` (${m.units} unidades)` : ""}`,
      m.city && `*Cidade:* ${m.city}`,
      m.urgency && `*Prazo:* ${m.urgency}`,
      ``,
      `*Contato do síndico:* ${m.name}${m.phone ? ` · ${m.phone}` : ""}${m.email ? ` · ${m.email}` : ""}`,
      ``,
      `Por favor, entre em contato diretamente com o síndico. Obrigado!`,
    ]
      .filter((l): l is string => typeof l === "string")
      .join("\n");

  const replyText = `Olá, ${m.name.split(" ")[0]}! Aqui é da equipe Ao Síndico. Recebemos sua mensagem pelo site${isQuote ? " e já estamos encaminhando seu pedido de orçamento às empresas" : ""}.`;
  const replyWa = whatsappLink(m.phone, replyText);

  return (
    <>
      <Link href="/admin/mensagens" className="adm-back">
        <Icon name="arrowLeft" size={15} /> Mensagens
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
          </div>
          <h1>{m.name}</h1>
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
            <ConfirmButton message="Excluir esta mensagem definitivamente?" className="btn btn--ghost" icon="trash">
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
                <span className="hint">{m.suppliers.filter((s) => s.sentAt).length} de {m.suppliers.length} enviados</span>
              </div>
              {m.suppliers.length === 0 ? (
                <p className="hint">Escolha as empresas ao lado (em “Empresas relacionadas”) e salve. Elas aparecerão aqui com botões de envio.</p>
              ) : (
                <div className="sent-list">
                  {m.suppliers.map(({ supplier: s, sentAt, requested }) => {
                    const text = quoteText(s.name);
                    const wa = whatsappLink(s.whatsapp || s.phone, text);
                    return (
                      <div key={s.id} className="sent-item">
                        <div className="sent-item__head">
                          <div>
                            <strong>{s.name}</strong>
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
                          <CopyButton text={text} label="Copiar texto" />
                          <form action={markSupplierSent.bind(null, m.id, s.id, !sentAt)}>
                            <SubmitButton className="btn btn--ghost btn--sm" pendingText="…">
                              {sentAt ? "Desmarcar" : "Marcar como enviado"}
                            </SubmitButton>
                          </form>
                        </div>
                        {!wa && !s.email && <span className="hint">Esta empresa não tem WhatsApp nem e-mail cadastrado — use “Copiar texto”.</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        <MessageForm
          action={updateMessage.bind(null, m.id)}
          status={m.status}
          notes={m.notes ?? ""}
          isQuote={isQuote}
          category={m.category}
          selected={m.suppliers.map((s) => s.supplierId)}
          suppliers={allSuppliers.map((s) => ({ id: s.id, name: s.name, city: s.city, categories: s.categories.map((c) => c.name) }))}
        />
      </div>
    </>
  );
}
