import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { CopyButton } from "@/components/admin/Buttons";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABEL, TYPE_LABEL } from "../../messages";

export const metadata = { title: "Orçamentos e mensagens" };

type SP = Promise<{ aba?: string; tipo?: string; q?: string; ok?: string }>;

const TABS = [
  { key: "responder", label: "Responder", where: { status: "novo" } },
  { key: "andamento", label: "Em andamento", where: { status: "andamento" } },
  { key: "respondido", label: "Respondido", where: { status: "respondido" } },
  { key: "arquivado", label: "Arquivado", where: { status: "arquivado" } },
  { key: "todas", label: "Todas", where: {} },
] as const;

export default async function MessagesPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin("mensagens");
  const sp = await searchParams;
  const aba = sp.aba ?? "responder";

  if (aba === "newsletter") {
    const subs = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
    return (
      <>
        <Header aba={aba} counts={await counts()} />
        <section className="panel panel__pad">
          <div className="panel__title">
            {subs.length} inscritos na newsletter
            {subs.length > 0 && <CopyButton text={subs.map((s) => s.email).join(", ")} label="Copiar todos os e-mails" />}
          </div>
          <div className="rows">
            {subs.map((s) => (
              <div key={s.id} className="row-item" style={{ gridTemplateColumns: "1fr auto" }}>
                <span>{s.email}</span>
                <span className="hint">{formatDateTime(s.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  const tab = TABS.find((t) => t.key === aba) ?? TABS[0];
  const q = sp.q?.trim();
  const where: Prisma.MessageWhereInput = {
    ...tab.where,
    ...(sp.tipo ? { type: sp.tipo } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const messages = await db.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { suppliers: true } } },
  });

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ aba, tipo: sp.tipo, q, ...patch })) if (v) p.set(k, v);
    return `/admin/mensagens?${p}`;
  };

  return (
    <>
      <Header aba={aba} counts={await counts()} />
      {sp.ok === "removido" && (
        <div className="flash" role="status">
          <Icon name="check" /> Mensagem removida.
        </div>
      )}
      <form className="toolbar" action="/admin/mensagens">
        <input type="hidden" name="aba" value={aba} />
        <div className="search">
          <Icon name="search" />
          <input name="q" className="input" placeholder="Buscar por nome, e-mail, condomínio…" defaultValue={q} aria-label="Buscar" />
        </div>
        <nav className="tabs" aria-label="Tipo">
          <Link href={link({ tipo: undefined })} aria-current={!sp.tipo}>
            Todos os tipos
          </Link>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <Link key={k} href={link({ tipo: k })} aria-current={sp.tipo === k}>
              {v}
            </Link>
          ))}
        </nav>
      </form>

      <section className="panel">
        {messages.length === 0 ? (
          <div className="adm-empty">
            <Icon name="check" size={30} />
            <strong>{tab.key === "responder" ? "Nenhuma mensagem esperando resposta" : "Nada por aqui"}</strong>
            Pedidos de orçamento, empresas querendo anunciar e contatos do site chegam aqui.
          </div>
        ) : (
          messages.map((m) => (
            <Link key={m.id} href={`/admin/mensagens/${m.id}`} className="msg-row" data-unread={m.status === "novo"}>
              <span className="msg-dot" />
              <span style={{ minWidth: 0 }}>
                <span className="msg-row__top">
                  <span className="msg-row__name">{m.name}</span>
                  <span className="type-chip" data-type={m.type}>
                    {TYPE_LABEL[m.type] ?? m.type}
                  </span>
                  {tab.key === "todas" && (
                    <span className="status-chip" data-status={m.status}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  )}
                  {m._count.suppliers > 0 && (
                    <span className="hint">
                      <Icon name="building" size={12} style={{ display: "inline", verticalAlign: -1 }} /> {m._count.suppliers} empresa(s)
                    </span>
                  )}
                </span>
                <span className="msg-row__text">
                  {[m.subject, m.company, m.city, m.assignedTo ? `Resp.: ${m.assignedTo}` : null].filter(Boolean).join(" · ")}
                  {m.body ? ` — ${m.body}` : ""}
                </span>
              </span>
              <span className="msg-row__date">{formatDateTime(m.createdAt)}</span>
            </Link>
          ))
        )}
      </section>
    </>
  );
}

async function counts() {
  const groups = await db.message.groupBy({ by: ["status"], _count: true });
  const map = Object.fromEntries(groups.map((g) => [g.status, g._count]));
  return { ...map, newsletter: await db.subscriber.count() } as Record<string, number>;
}

function Header({ aba, counts }: { aba: string; counts: Record<string, number> }) {
  const n = (k: string) => counts[k] ?? 0;
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Orçamentos e mensagens</h1>
          <p>Tudo o que chega pelo site: pedidos de orçamento, empresas que querem anunciar e contatos.</p>
        </div>
      </div>
      <nav className="tabs" style={{ marginBottom: 14, width: "fit-content", maxWidth: "100%" }} aria-label="Situação">
        {TABS.map((t) => {
          const c = t.key === "responder" ? n("novo") : t.key === "todas" ? undefined : n(t.key);
          return (
            <Link key={t.key} href={`/admin/mensagens?aba=${t.key}`} aria-current={aba === t.key} data-tone={t.key === "responder" && c ? "red" : undefined}>
              {t.label} {c !== undefined && <span className="count">{c}</span>}
            </Link>
          );
        })}
        <Link href="/admin/mensagens?aba=newsletter" aria-current={aba === "newsletter"}>
          Newsletter <span className="count">{n("newsletter")}</span>
        </Link>
      </nav>
    </>
  );
}
