import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { TYPE_LABEL } from "../messages";

export const metadata = { title: "Início" };

export default async function Dashboard() {
  const user = await requireAdmin();
  const now = new Date();
  const [newMsgs, openMsgs, suppliers, activeAds, articles, nextEvents, subscribers, latest] = await Promise.all([
    db.message.count({ where: { status: "novo" } }),
    db.message.count({ where: { status: "andamento" } }),
    db.supplier.count({ where: { published: true } }),
    db.campaign.count({ where: { published: true, OR: [{ endsAt: null }, { endsAt: { gte: now } }] } }),
    db.article.count({ where: { published: true } }),
    db.event.count({ where: { published: true, startsAt: { gte: now } } }),
    db.subscriber.count(),
    db.message.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const kpis: { label: string; value: number; icon: IconName; href: string; alert?: boolean }[] = [
    { label: "mensagens novas", value: newMsgs, icon: "inbox", href: "/admin/mensagens", alert: newMsgs > 0 },
    { label: "em andamento", value: openMsgs, icon: "clock", href: "/admin/mensagens?aba=andamento" },
    { label: "fornecedores no ar", value: suppliers, icon: "building", href: "/admin/fornecedores" },
    { label: "anúncios ativos", value: activeAds, icon: "megaphone", href: "/admin/anuncios" },
    { label: "matérias publicadas", value: articles, icon: "newspaper", href: "/admin/materias" },
    { label: "próximos eventos", value: nextEvents, icon: "calendar", href: "/admin/eventos" },
    { label: "inscritos na newsletter", value: subscribers, icon: "mail", href: "/admin/mensagens?aba=newsletter" },
  ];

  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(now));
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>
            {greet}, {user.name.split(" ")[0]}!
          </h1>
          <p>{newMsgs > 0 ? `Você tem ${newMsgs} ${newMsgs === 1 ? "mensagem nova" : "mensagens novas"} para responder.` : "Tudo em dia por aqui."}</p>
        </div>
        <div className="adm-head__actions">
          <Link href="/admin/mensagens" className="btn btn--magenta">
            <Icon name="inbox" /> Abrir mensagens
          </Link>
        </div>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className={`kpi${k.alert ? " kpi--alert" : ""}`}>
            <span className="kpi__icon">
              <Icon name={k.icon} />
            </span>
            <strong>{k.value}</strong>
            <span>{k.label}</span>
          </Link>
        ))}
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel__pad" style={{ paddingBottom: 0 }}>
            <div className="panel__title">
              Últimas mensagens
              <Link href="/admin/mensagens" className="link-arrow" style={{ fontSize: 14 }}>
                Ver todas <Icon name="arrowRight" size={15} />
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
                  <span className="msg-row__text">{m.subject ? `${m.subject} — ` : ""}{m.body}</span>
                </span>
                <span className="msg-row__date">{formatDateTime(m.createdAt)}</span>
              </Link>
            ))
          )}
        </section>

        <section className="panel panel__pad">
          <div className="panel__title">Atalhos</div>
          <div className="quick">
            <Link href="/admin/fornecedores/novo">
              <Icon name="plus" /> Novo fornecedor
            </Link>
            <Link href="/admin/anuncios/novo">
              <Icon name="plus" /> Novo anúncio
            </Link>
            <Link href="/admin/materias/novo">
              <Icon name="plus" /> Nova matéria
            </Link>
            <Link href="/admin/eventos/novo">
              <Icon name="plus" /> Novo evento
            </Link>
            <Link href="/admin/cursos/novo">
              <Icon name="plus" /> Novo curso
            </Link>
            <Link href="/admin/parceiros/novo">
              <Icon name="plus" /> Novo parceiro
            </Link>
            <Link href="/admin/conteudo">
              <Icon name="layout" /> Textos do site
            </Link>
          </div>
          <p className="hint" style={{ marginTop: 18 }}>
            Tudo o que você salvar aqui aparece no site na hora. Para esconder algo sem apagar, desmarque “Publicado no site”.
          </p>
        </section>
      </div>
    </>
  );
}
