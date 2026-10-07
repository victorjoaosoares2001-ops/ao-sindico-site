import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteResource, togglePublished } from "@/admin/actions";
import { delegate } from "@/admin/data";
import { getResource, OPTION_LABELS, type ListColumn } from "@/admin/resources";
import { ConfirmButton } from "@/components/admin/Buttons";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { placementLabel } from "@/lib/placements";

type Row = Record<string, unknown> & { id: string };

function cell(row: Row, col: ListColumn) {
  const raw = col.field.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], row);
  if (raw === null || raw === undefined || raw === "") return null;
  switch (col.kind) {
    case "date":
      return formatDate(raw as Date, { day: "2-digit", month: "short", year: "numeric" });
    case "bool":
      return raw ? "Sim" : null;
    case "stars":
      return "★".repeat(Number(raw)) + "☆".repeat(5 - Number(raw));
    case "badge":
      if (col.field === "placement") return placementLabel(String(raw));
      return OPTION_LABELS[`${col.field}:${raw}`] ?? String(raw);
    case "relation":
      return (raw as { name?: string }).name ?? null;
    case "relationMany":
      return (raw as { name: string }[]).map((x) => x.name).join(", ") || null;
    default:
      return String(raw);
  }
}

const FLASH: Record<string, string> = { salvo: "Salvo! Já está atualizado no site.", removido: "Removido." };
const PER_PAGE = 40;

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  return { title: getResource((await params).resource)?.plural ?? "Painel" };
}

export default async function ResourceList({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { resource } = await params;
  const sp = await searchParams;
  const def = getResource(resource);
  if (!def) notFound();
  await requireAdmin(def.module);

  const q = sp.q?.trim();
  const tab = def.tabs?.find((t) => t.key === sp.aba);
  const urlWhere = Object.fromEntries((def.urlFilters ?? []).filter((f) => sp[f]).map((f) => [f, sp[f]]));
  const where = {
    ...(q ? { [def.titleField]: { contains: q, mode: "insensitive" } } : {}),
    ...(tab?.where ?? {}),
    ...urlWhere,
  };
  const page = Math.max(1, Number(sp.pagina) || 1);
  const [rows, total, tabCounts] = await Promise.all([
    delegate(def.model).findMany({ where, orderBy: def.orderBy, include: def.include, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    delegate(def.model).count({ where }),
    Promise.all((def.tabs ?? []).map((t) => delegate(def.model).count({ where: { ...t.where, ...urlWhere } }))),
  ]);
  const all = await delegate(def.model).count({ where: urlWhere });
  const pages = Math.ceil(total / PER_PAGE);
  const novo = def.gender === "a" ? "Nova" : "Novo";
  const filterQs = new URLSearchParams(urlWhere as Record<string, string>).toString();
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...urlWhere, aba: sp.aba, q, ...patch })) if (v) p.set(k, String(v));
    return `/admin/${def.key}${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{def.plural}</h1>
          <p>{def.description}</p>
        </div>
        <div className="adm-head__actions">
          <Link href={`/admin/${def.key}/novo${filterQs ? `?${filterQs}` : ""}`} className="btn btn--magenta">
            <Icon name="plus" /> {novo} {def.singular}
          </Link>
        </div>
      </div>

      {sp.ok && FLASH[sp.ok] && (
        <div className="flash" role="status">
          <Icon name="check" /> {FLASH[sp.ok]}
        </div>
      )}
      {Object.keys(urlWhere).length > 0 && (
        <div className="flash" style={{ background: "var(--yellow-soft)", color: "#6b4b00" }}>
          <Icon name="filter" /> Mostrando apenas os itens filtrados.{" "}
          <Link href={`/admin/${def.key}`} style={{ textDecoration: "underline" }}>
            Ver todos
          </Link>
        </div>
      )}

      <form className="toolbar" action={`/admin/${def.key}`}>
        {Object.entries(urlWhere).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={String(v)} />
        ))}
        {sp.aba && <input type="hidden" name="aba" value={sp.aba} />}
        <div className="search">
          <Icon name="search" />
          <input name="q" className="input" placeholder={`Buscar em ${def.plural.toLowerCase()}`} defaultValue={q} aria-label="Buscar" />
        </div>
      </form>
      {def.tabs && (
        <nav className="tabs" aria-label="Filtrar" style={{ marginBottom: 14, maxWidth: "100%", width: "fit-content" }}>
          <Link href={link({ aba: undefined, pagina: undefined })} aria-current={!tab}>
            Todos <span className="count">{all}</span>
          </Link>
          {def.tabs.map((t, i) => (
            <Link key={t.key} href={link({ aba: t.key, pagina: undefined })} aria-current={tab?.key === t.key} data-tone={(t.key === "pendente" && tabCounts[i]) ? "red" : undefined}>
              {t.label} <span className="count">{tabCounts[i]}</span>
            </Link>
          ))}
        </nav>
      )}

      <section className="panel rows">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <Icon name={def.icon} size={30} />
            <strong>{q ? "Nada encontrado" : `Nenhum ${def.singular} aqui`}</strong>
            {!q && (
              <Link href={`/admin/${def.key}/novo${filterQs ? `?${filterQs}` : ""}`} className="btn btn--sm">
                <Icon name="plus" /> Cadastrar agora
              </Link>
            )}
          </div>
        ) : (
          rows.map((row) => {
            const title = String(row[def.titleField] ?? "");
            const img = def.imageField ? (row[def.imageField] as string | null) : null;
            const pub = def.publishField ? (row[def.publishField] as boolean | undefined) : undefined;
            const publicUrl = def.publicPath?.(row);
            return (
              <div key={row.id} className="row-item">
                <span className="row-thumb">{img ? <img src={img} alt="" loading="lazy" /> : <Icon name={def.icon} />}</span>
                <div className="row-main">
                  <Link href={`/admin/${def.key}/${row.id}`} className="row-title">
                    {title}
                  </Link>
                  <div className="row-meta">
                    {def.columns.map((c) => {
                      const v = cell(row, c);
                      return v ? (
                        <span key={c.field}>
                          {c.label}: <em>{v}</em>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="row-actions">
                  {def.publishField && (
                    <form action={togglePublished.bind(null, def.key, row.id, !pub)}>
                      <button className="status-toggle" data-on={!!pub} title={pub ? "Clique para tirar do site" : "Clique para publicar"}>
                        <i /> {pub ? "No site" : "Fora do site"}
                      </button>
                    </form>
                  )}
                  {publicUrl && pub !== false && (
                    <a href={publicUrl} target="_blank" rel="noopener" className="icon-btn" title="Ver no site" aria-label="Ver no site">
                      <Icon name="eye" />
                    </a>
                  )}
                  <Link href={`/admin/${def.key}/${row.id}`} className="icon-btn" title="Editar" aria-label="Editar">
                    <Icon name="edit" />
                  </Link>
                  <form action={deleteResource.bind(null, def.key, row.id)}>
                    <ConfirmButton message={`Remover “${title}”? Essa ação não pode ser desfeita.`} className="icon-btn icon-btn--danger" icon="trash" title="Remover" />
                  </form>
                </div>
              </div>
            );
          })
        )}
      </section>
      {pages > 1 && (
        <nav className="tabs" style={{ margin: "18px auto 0", width: "fit-content", maxWidth: "100%" }} aria-label="Páginas">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={link({ pagina: String(n) })} aria-current={n === page}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
