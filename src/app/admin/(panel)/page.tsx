import Link from "next/link";
import { History } from "@/components/admin/History";
import { Icon, type IconName } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { can, type Module } from "@/lib/permissions";
import { placementLabel } from "@/lib/placements";
import { TYPE_LABEL } from "../messages";

export const metadata = { title: "Início" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ "sem-permissao"?: string }> }) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const now = new Date();
  const in7 = new Date(Date.now() + 7 * 86400_000);
  const live = { published: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] };

  const [newMsgs, openMsgs, liveAds, ending, pendingReviews, pendingQuestions, nextEvent, latest] = await Promise.all([
    db.message.count({ where: { status: "novo" } }),
    db.message.count({ where: { status: "andamento" } }),
    db.campaign.count({ where: live }),
    db.campaign.findMany({ where: { published: true, endsAt: { gte: now, lte: in7 } }, include: { supplier: { select: { name: true } } }, orderBy: { endsAt: "asc" } }),
    db.review.count({ where: { status: "pendente" } }),
    db.question.count({ where: { status: "pendente" } }),
    db.event.findFirst({ where: { published: true, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, include: { _count: { select: { registrations: true } } } }),
    db.message.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const kpis: { label: string; value: number | string; icon: IconName; href: string; alert?: boolean; module: Module }[] = [
    { label: "pedidos e mensagens novas", value: newMsgs, icon: "inbox", href: "/admin/mensagens", alert: newMsgs > 0, module: "mensagens" },
    { label: "em andamento", value: openMsgs, icon: "clock", href: "/admin/mensagens?aba=andamento", module: "mensagens" },
    { label: "anúncios no ar", value: liveAds, icon: "megaphone", href: "/admin/anuncios?aba=publicado", module: "comercial" },
    { label: "anúncios vencem em 7 dias", value: ending.length, icon: "calendar", href: "/admin/anuncios", alert: ending.length > 0, module: "comercial" },
    { label: "avaliações para aprovar", value: pendingReviews, icon: "star", href: "/admin/avaliacoes?aba=pendente", alert: pendingReviews > 0, module: "comercial" },
    { label: "perguntas sem resposta", value: pendingQuestions, icon: "quote", href: "/admin/tira-duvidas?aba=pendente", alert: pendingQuestions > 0, module: "conteudo" },
    ...(nextEvent
      ? [{ label: `inscritos · ${nextEvent.title.slice(0, 32)}`, value: nextEvent._count.registrations, icon: "users" as IconName, href: `/admin/eventos/${nextEvent.id}`, module: "agenda" as Module }]
      : []),
  ];

  const quick: { href: string; label: string; icon: IconName; module: Module }[] = [
    { href: "/admin/fornecedores/novo", label: "Cadastrar empresa", icon: "building", module: "comercial" },
    { href: "/admin/anuncios/novo", label: "Novo anúncio", icon: "megaphone", module: "comercial" },
    { href: "/admin/materias/novo", label: "Nova matéria", icon: "newspaper", module: "conteudo" },
    { href: "/admin/tira-duvidas?aba=pendente", label: "Responder perguntas", icon: "quote", module: "conteudo" },
    { href: "/admin/eventos/novo", label: "Novo evento", icon: "calendar", module: "agenda" },
    { href: "/admin/videos/novo", label: "Novo vídeo", icon: "youtube", module: "conteudo" },
    { href: "/admin/conteudo", label: "Textos do site", icon: "layout", module: "site" },
  ];

  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(now));
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      {sp["sem-permissao"] && (
        <div className="alert alert--error" style={{ marginBottom: 16 }}>
          Seu perfil não tem acesso àquela área. Fale com a administração se precisar.
        </div>
      )}
      <div className="adm-head">
        <div>
          <h1>
            {greet}, {user.name.split(" ")[0]}!
          </h1>
          <p>
            {can(user.role, "mensagens") && newMsgs > 0
              ? `Você tem ${newMsgs} ${newMsgs === 1 ? "pedido/mensagem nova" : "pedidos e mensagens novas"} para responder.`
              : "Tudo em dia por aqui."}
          </p>
        </div>
        {can(user.role, "mensagens") && (
          <div className="adm-head__actions">
            <Link href="/admin/mensagens" className="btn btn--magenta">
              <Icon name="inbox" /> Abrir orçamentos
            </Link>
          </div>
        )}
      </div>

      <div className="kpis">
        {kpis
          .filter((k) => can(user.role, k.module))
          .map((k) => (
            <Link key={k.label} href={k.href} className={`kpi${k.alert ? " kpi--alert" : ""}`}>
              <span className="kpi__icon">
                <Icon name={k.icon} />
              </span>
              <strong>{k.value}</strong>
              <span>{k.label}</span>
            </Link>
          ))}
      </div>

      <section className="panel panel__pad" style={{ marginBottom: 18 }}>
        <div className="panel__title">O que você quer fazer?</div>
        <div className="quick">
          {quick
            .filter((q) => can(user.role, q.module))
            .map((q) => (
              <Link key={q.href} href={q.href}>
                <Icon name={q.icon} /> {q.label}
              </Link>
            ))}
        </div>
      </section>

      <div className="dash-grid">
        {can(user.role, "mensagens") && (
          <section className="panel">
            <div className="panel__pad" style={{ paddingBottom: 0 }}>
              <div className="panel__title">
                Últimos pedidos e mensagens
                <Link href="/admin/mensagens" className="link-arrow" style={{ fontSize: 14 }}>
                  Ver todos <Icon name="arrowRight" size={15} />
                </Link>
              </div>
            </div>
            {latest.length === 0 ? (
              <div className="adm-empty">
                <Icon name="inbox" size={28} />
                <strong>Nenhuma mensagem ainda</strong>
                Pedidos de orçamento e contatos do site aparecem aqui.
              </div>
            ) : (
              latest.map((m) => (
                <Link key={m.id} href={`/admin/mensagens/${m.id}`} className="msg-row" data-unread={m.status === "novo"}>
                  <span className="msg-dot" />
                  <span style={{ minWidth: 0 }}>
                    <span className="msg-row__top">
                      <span className="msg-row__name">{m.name}</span>
                      <span className="type-chip" data-type={m.type}>
                        {TYPE_LABEL[m.type] ?? m.type}
                      </span>
                    </span>
                    <span className="msg-row__text">
                      {m.subject ? `${m.subject} — ` : ""}
                      {m.body}
                    </span>
                  </span>
                  <span className="msg-row__date">{formatDateTime(m.createdAt)}</span>
                </Link>
              ))
            )}
          </section>
        )}

        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          {can(user.role, "comercial") && (
            <section className="panel panel__pad">
              <div className="panel__title">Anúncios que vencem nos próximos 7 dias</div>
              {ending.length === 0 ? (
                <p className="hint">Nenhum anúncio vencendo esta semana.</p>
              ) : (
                <div className="mini-list">
                  {ending.map((c) => (
                    <Link key={c.id} href={`/admin/anuncios/${c.id}`} className="mini-item">
                      <span className="mini-thumb">{c.image ? <img src={c.image} alt="" /> : <Icon name="image" />}</span>
                      <span style={{ minWidth: 0 }}>
                        <strong>{c.supplier?.name ?? c.title}</strong>
                        <span className="hint">
                          {placementLabel(c.placement)} · termina {formatDate(c.endsAt!, { day: "2-digit", month: "short" })}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
          {can(user.role, "historico") && (
            <section className="panel panel__pad">
              <div className="panel__title">
                Atividade recente
                <Link href="/admin/historico" className="link-arrow" style={{ fontSize: 14 }}>
                  Histórico <Icon name="arrowRight" size={15} />
                </Link>
              </div>
              <History take={8} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
