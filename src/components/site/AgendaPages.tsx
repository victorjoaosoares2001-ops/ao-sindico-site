import Link from "next/link";
import type { Course, Event, Partner } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { AgendaCard } from "@/components/site/Cards";
import { CertificateForm, NewsletterForm, RegistrationForm } from "@/components/site/Forms";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { findCertificate, registerForEvent } from "@/lib/public-actions";

const MODE: Record<string, string> = { online: "Online", presencial: "Presencial", hibrido: "Híbrido" };

export function AgendaList({ kind, upcoming, past }: { kind: "evento" | "curso"; upcoming: (Event | Course)[]; past: (Event | Course)[] }) {
  const isEvent = kind === "evento";
  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>{isEvent ? "Eventos" : "Cursos"}</span>
          </nav>
          <h1>
            {isEvent ? "Encontros de síndicos" : "Cursos para síndicos"} <span className="serif">{isEvent ? "e eventos." : "e gestores."}</span>
          </h1>
          <p>
            {isEvent
              ? "Networking, palestras e conteúdo prático. Inscrição pelo site e certificado de participação."
              : "Capacitação para síndicos, conselheiros e administradoras."}
          </p>
        </div>
      </section>
      <section className="section section--first">
        <div className="container">
          <h2 style={{ fontSize: 24, marginBottom: 20 }}>{isEvent ? "Próximos eventos" : "Turmas abertas"}</h2>
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
              <h2 style={{ fontSize: 22, margin: "48px 0 20px", color: "var(--ink-3)" }}>{isEvent ? "Edições anteriores" : "Outros cursos"}</h2>
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

type EventFull = Event & { sponsors: Partner[]; _count: { registrations: number } };

export function AgendaDetail({ item, kind }: { item: EventFull | Course; kind: "evento" | "curso" }) {
  const isEvent = kind === "evento";
  const ev = isEvent ? (item as EventFull) : null;
  const facts: [string, string][] = [];
  if (item.startsAt) facts.push(["calendar", formatDate(item.startsAt, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })]);
  const time = item.startsAt ? formatDate(item.startsAt, { hour: "2-digit", minute: "2-digit" }) : "";
  if (time && time !== "00:00") facts.push(["clock", time]);
  if (ev) {
    const where = [ev.venue, ev.address, ev.city].filter(Boolean).join(" · ");
    if (where) facts.push(["mapPin", where]);
    if (ev.capacity) facts.push(["users", `${Math.max(0, ev.capacity - ev._count.registrations)} vagas restantes de ${ev.capacity}`]);
  } else {
    const c = item as Course;
    facts.push(["globe", MODE[c.mode] ?? c.mode]);
    if (c.workload) facts.push(["clock", c.workload]);
    if (c.instructor) facts.push(["users", c.instructor]);
    if (c.price) facts.push(["tag", c.price]);
  }
  const past = !!item.startsAt && item.startsAt < new Date();
  const full = !!ev?.capacity && ev._count.registrations >= ev.capacity;
  const canRegister = !!ev && !past && ev.registrationOpen && !ev.link && !full;
  const mapsUrl = ev && (ev.address || ev.venue) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ev.venue, ev.address, ev.city].filter(Boolean).join(", "))}` : null;

  return (
    <>
      <section className="page-hero page-hero--slim">
        {item.cover && <img src={item.cover} alt="" style={{ position: "absolute", inset: 0, zIndex: -2, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />}
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <Link href={isEvent ? "/eventos" : "/cursos"}>{isEvent ? "Eventos" : "Cursos"}</Link>
          </nav>
          <span className={`chip ${isEvent ? "chip--magenta" : "chip--teal"}`} style={{ marginBottom: 14 }}>
            {isEvent ? "Evento" : "Curso"}
            {past ? " · encerrado" : canRegister ? " · inscrições abertas" : ""}
          </span>
          <h1 style={{ fontSize: "clamp(28px,4.4vw,52px)" }}>{item.title}</h1>
          {item.excerpt && <p>{item.excerpt}</p>}
        </div>
      </section>
      <section className="section section--first">
        <div className="container profile">
          <div>
            {canRegister && (
              <div className="card" id="inscricao" style={{ scrollMarginTop: 110 }}>
                <h2>Inscrição</h2>
                <p style={{ color: "var(--ink-3)", margin: "-6px 0 18px", fontSize: 15 }}>Gratuita. Você recebe a confirmação na tela; o e-mail informado dá acesso ao certificado.</p>
                <RegistrationForm action={registerForEvent.bind(null, ev!.id)} eventTitle={item.title} />
              </div>
            )}
            {"description" in item && item.description && (
              <div className="card">
                <div className="prose" style={{ fontSize: 17 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }} />
              </div>
            )}
            {item.cover && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <img src={item.cover} alt="" style={{ width: "100%" }} />
              </div>
            )}
            {ev && ev.sponsors.length > 0 && (
              <div className="card">
                <h2>Patrocínio</h2>
                <div className="sponsors">
                  {ev.sponsors.map((p) =>
                    p.url ? (
                      <a key={p.id} href={p.url} target="_blank" rel="noopener">
                        {p.logo ? <img src={p.logo} alt={p.name} /> : p.name}
                      </a>
                    ) : (
                      <span key={p.id}>{p.logo ? <img src={p.logo} alt={p.name} /> : p.name}</span>
                    ),
                  )}
                </div>
                <Link href="/anuncie" className="link-arrow" style={{ marginTop: 14 }}>
                  Quero patrocinar <Icon name="arrowUpRight" size={15} />
                </Link>
              </div>
            )}
            {ev && past && ev.certificateUrl && (
              <div className="card" id="certificado">
                <h2>Certificado de participação</h2>
                <CertificateForm action={findCertificate.bind(null, ev.id)} />
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
                {mapsUrl && (
                  <li>
                    <a href={mapsUrl} target="_blank" rel="noopener">
                      <Icon name="arrowUpRight" /> Abrir no mapa
                    </a>
                  </li>
                )}
              </ul>
              {canRegister && (
                <a href="#inscricao" className="btn btn--magenta btn--block btn--arrow" style={{ marginTop: 18 }}>
                  Quero participar
                  <span className="btn__dot">
                    <Icon name="arrowRight" size={16} />
                  </span>
                </a>
              )}
              {item.link && !past && (
                <a href={item.link} target="_blank" rel="noopener" className="btn btn--magenta btn--block btn--arrow" style={{ marginTop: 18 }}>
                  {isEvent ? "Fazer inscrição" : "Inscrever-se no curso"}
                  <span className="btn__dot">
                    <Icon name="arrowUpRight" size={16} />
                  </span>
                </a>
              )}
              {full && !past && <p style={{ marginTop: 14, color: "var(--magenta)", fontWeight: 600 }}>Vagas esgotadas.</p>}
              {ev && !past && !ev.registrationOpen && !ev.link && <p style={{ marginTop: 14, color: "var(--ink-3)" }}>Inscrições em breve.</p>}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
