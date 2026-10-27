import Link from "next/link";
import Image from "next/image";
import type { Article, ArticleSection, Author, Course, Event } from "@prisma/client";
import { Icon } from "@/components/Icon";
import { dayMonth, formatDate } from "@/lib/format";
import type { SupplierCardData } from "@/lib/queries";

const PLAN_BADGE: Record<string, { label: string; cls: string; icon: "star" | "check" } | undefined> = {
  premium: { label: "Premium", cls: "chip--yellow", icon: "star" },
  verificado: { label: "Verificado", cls: "chip--teal", icon: "check" },
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function cardExcerpt(value: string | null | undefined, limit = 190) {
  if (!value) return "";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit).trimEnd()}…` : clean;
}

export function SupplierCard({ s, delay = 0, rating, priority = false }: { s: SupplierCardData; delay?: number; rating?: { avg: number; count: number }; priority?: boolean }) {
  const badge = PLAN_BADGE[s.plan];
  // sem foto de capa: o próprio logo vira a imagem do cartão
  const logoAsCover = !s.cover && !!s.logo;
  const summary = cardExcerpt(s.tagline || s.description);
  const mediaClass = ["sup-card__media", logoAsCover ? "sup-card__media--logo" : "", !logoAsCover && s.logo ? "sup-card__media--with-logo" : ""].filter(Boolean).join(" ");
  return (
    <article className="sup-card" data-reveal style={{ ["--d" as string]: `${delay}s` }}>
      <Link href={`/fornecedores/${s.slug}`} prefetch={false} className={mediaClass} aria-label={s.name}>
        {s.cover && <Image className="cover" src={s.cover} alt="" fill sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 390px" quality={68} priority={priority} />}
        {logoAsCover && <Image className="logo-cover" src={s.logo!} alt="" width={420} height={260} sizes="(max-width: 680px) 78vw, 320px" quality={70} priority={priority} />}
        <div className="sup-card__badges">
          {badge ? (
            <span className={`chip ${badge.cls}`}>
              <Icon name={badge.icon} size={12} /> {badge.label}
            </span>
          ) : (
            <span />
          )}
          {s.featured && <span className="chip chip--glass">Destaque</span>}
        </div>
        {!logoAsCover && <span className="sup-card__logo">{s.logo ? <Image src={s.logo} alt="" width={96} height={96} sizes="60px" quality={70} priority={priority} /> : initials(s.name)}</span>}
      </Link>
      <div className="sup-card__body">
        {s.categories.length > 0 && <div className="sup-card__cats">{s.categories.map((c) => c.name).join(" · ")}</div>}
        <h3>
          <Link href={`/fornecedores/${s.slug}`} prefetch={false}>{s.name}</Link>
        </h3>
        {rating && rating.count > 0 && (
          <span className="sup-card__rating">
            <b>★ {rating.avg.toFixed(1)}</b> · {rating.count} {rating.count === 1 ? "avaliação" : "avaliações"}
          </span>
        )}
        {summary && <p className="sup-card__text">{summary}</p>}
        <div className="sup-card__foot">
          <span className="sup-card__loc">
            {s.city && (
              <>
                <Icon name="mapPin" size={14} /> {s.city}
                {s.state ? ` · ${s.state}` : ""}
              </>
            )}
          </span>
          <Link href={`/fornecedores/${s.slug}`} prefetch={false} className="btn btn--magenta btn--sm">
            Ver empresa
          </Link>
        </div>
      </div>
    </article>
  );
}

type ArticleWithSection = Article & { section: ArticleSection | null; authorRef?: Author | null };

export function PostCard({ a, delay = 0 }: { a: ArticleWithSection; delay?: number }) {
  return (
    <Link href={`/informe-se/${a.slug}`} prefetch={false} className="post-card" data-reveal style={{ ["--d" as string]: `${delay}s` }}>
      <div className="post-card__img">{a.cover && <Image src={a.cover} alt="" fill sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 390px" quality={72} />}</div>
      <div>
        <div className="meta">
          {a.section && <b>{a.section.name}</b>}
          <span>{formatDate(a.publishedAt)}</span>
          {a.authorRef && <span>· {a.authorRef.name}</span>}
        </div>
        <h3>{a.title}</h3>
      </div>
      {a.excerpt && <p>{a.excerpt}</p>}
    </Link>
  );
}

export function AgendaCard({ item, kind, delay = 0 }: { item: Event | Course; kind: "evento" | "curso"; delay?: number }) {
  const d = item.startsAt ? dayMonth(item.startsAt) : null;
  const href = kind === "evento" ? `/eventos/${item.slug}` : `/cursos/${item.slug}`;
  const where = "venue" in item ? [item.venue, item.city].filter(Boolean).join(" · ") : item.mode === "online" ? "Online" : item.mode === "hibrido" ? "Híbrido" : "Presencial";
  return (
    <Link href={href} prefetch={false} className="agenda-card" data-reveal style={{ ["--d" as string]: `${delay}s` }}>
      <div className={`date-block${kind === "curso" ? " date-block--teal" : ""}`}>
        {d ? (
          <>
            <strong>{d.day}</strong>
            <span>{d.month}</span>
          </>
        ) : (
          <Icon name={kind === "curso" ? "book" : "calendar"} size={26} />
        )}
      </div>
      <div>
        <div className="meta">
          <b style={{ color: kind === "curso" ? "var(--teal-deep)" : undefined }}>{kind === "curso" ? "Curso" : "Evento"}</b>
          {where && <span>{where}</span>}
        </div>
        <h3>{item.title}</h3>
        {item.excerpt && <p>{item.excerpt}</p>}
      </div>
    </Link>
  );
}

export function SectionHead({
  num,
  label,
  title,
  accent,
  text,
  link,
}: {
  num: string;
  label: string;
  title: string;
  accent?: string;
  text?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="section-head" data-reveal>
      <div>
        <div className="eyebrow">
          <b>{num}</b> {label}
        </div>
        <h2 className="h-display">
          {title} {accent && <span className="serif">{accent}</span>}
        </h2>
      </div>
      <div className="section-head__aside">
        {text && <p>{text}</p>}
        {link && (
          <Link href={link.href} className="link-arrow">
            {link.label} <Icon name="arrowUpRight" size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
