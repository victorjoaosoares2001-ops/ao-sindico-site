import Link from "next/link";
import type { Course, Event } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { AgendaCard } from "@/components/site/Cards";
import { NewsletterForm } from "@/components/site/Forms";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";

const MODE: Record<string, string> = { online: "Online", presencial: "Presencial", hibrido: "Híbrido" };

export function AgendaList({ kind, upcoming, past }: { kind: "evento" | "curso"; upcoming: (Event | Course)[]; past: (Event | Course)[] }) {
  const isEvent = kind === "evento";
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>{isEvent ? "Eventos" : "Cursos"}</span>
          </nav>
          <h1>
            {isEvent ? "Encontros de síndicos" : "Cursos para síndicos"} <span className="serif">{isEvent ? "e eventos." : "e gestores."}</span>
          </h1>
          <p>
            {isEvent
              ? "Networking, palestras e conteúdo prático com quem vive o dia a dia do condomínio."
              : "Capacitação para síndicos, conselheiros e administradoras."}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: 26, marginBottom: 22 }}>{isEvent ? "Próximos eventos" : "Turmas abertas"}</h2>
          {upcoming.length > 0 ? (
            <div className="agenda">
              {upcoming.map((e, i) => (
                <AgendaCard key={e.id} item={e} kind={kind} delay={(i % 3) * 0.05} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="calendar" size={28} />
              <strong>Novas datas em breve.</strong>
              <p>Deixe seu e-mail para ser avisado primeiro.</p>
              <div style={{ width: "min(420px,100%)" }}>
                <NewsletterForm />
              </div>
            </div>
          )}
          {past.length > 0 && (
            <>
              <h2 style={{ fontSize: 22, margin: "56px 0 22px", color: "var(--ink-3)" }}>{isEvent ? "Edições anteriores" : "Outros cursos"}</h2>
              <div className="agenda" style={{ opacity: 0.85 }}>
                {past.map((e) => (
                  <AgendaCard key={e.id} item={e} kind={kind} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

export function AgendaDetail({ item, kind }: { item: Event | Course; kind: "evento" | "curso" }) {
  const isEvent = kind === "evento";
  const facts: [string, string][] = [];
  if (item.startsAt) facts.push(["calendar", formatDate(item.startsAt, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })]);
  const time = item.startsAt ? formatDate(item.startsAt, { hour: "2-digit", minute: "2-digit" }) : "";
  if (time && time !== "00:00") facts.push(["clock", time]); // 00:00 = horário não informado
  if ("venue" in item) {
    const where = [item.venue, item.city].filter(Boolean).join(" · ");
    if (where) facts.push(["mapPin", where]);
  } else {
    facts.push(["globe", MODE[item.mode] ?? item.mode]);
    if (item.workload) facts.push(["clock", item.workload]);
    if (item.instructor) facts.push(["users", item.instructor]);
    if (item.price) facts.push(["tag", item.price]);
  }
  const body = "description" in item ? item.description : null;
  const past = item.startsAt && item.startsAt < new Date();

  return (
    <>
      <section className="page-hero">
        {item.cover && <img src={item.cover} alt="" style={{ position: "absolute", inset: 0, zIndex: -2, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />}
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <Link href={isEvent ? "/eventos" : "/cursos"}>{isEvent ? "Eventos" : "Cursos"}</Link>
          </nav>
          <span className={`chip ${isEvent ? "chip--magenta" : "chip--teal"}`} style={{ marginBottom: 18 }}>
            {isEvent ? "Evento" : "Curso"}
            {past ? " · encerrado" : ""}
          </span>
          <h1 style={{ fontSize: "clamp(32px,5vw,60px)" }}>{item.title}</h1>
          {item.excerpt && <p>{item.excerpt}</p>}
        </div>
      </section>
      <section className="section">
        <div className="container profile">
          <div>
            {item.cover && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <img src={item.cover} alt="" style={{ width: "100%" }} />
              </div>
            )}
            {body && (
              <div className="card">
                <div className="prose" style={{ fontSize: 17 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
              </div>
            )}
          </div>
          <aside className="sticky-aside">
            <div className="card">
              <h2>Informações</h2>
              <ul className="contact-list">
                {facts.map(([icon, text]) => (
                  <li key={icon + text}>
                    <span style={{ textTransform: icon === "calendar" ? "capitalize" : undefined }}>
                      <Icon name={icon} /> {text}
                    </span>
                  </li>
                ))}
              </ul>
              {item.link && !past && (
                <a href={item.link} target="_blank" rel="noopener" className="btn btn--magenta btn--block btn--arrow" style={{ marginTop: 18 }}>
                  {isEvent ? "Quero participar" : "Fazer inscrição"}
                  <span className="btn__dot">
                    <Icon name="arrowUpRight" size={16} />
                  </span>
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
