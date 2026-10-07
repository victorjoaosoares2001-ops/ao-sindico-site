import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteResource, togglePublished } from "@/admin/actions";
import { delegate } from "@/admin/data";
import { getResource, OPTION_LABELS, type ListColumn } from "@/admin/resources";
import { ConfirmButton } from "@/components/admin/Buttons";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

type Row = Record<string, unknown> & { id: string };

function cell(row: Row, col: ListColumn) {
  const raw = col.field.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], row);
  if (raw === null || raw === undefined || raw === "") return null;
  switch (col.kind) {
    case "date":
      return formatDate(raw as Date, { day: "2-digit", month: "short", year: "numeric" });
    case "bool":
      return raw ? "Sim" : null;
    case "badge":
      return OPTION_LABELS[`${col.field}:${raw}`] ?? String(raw);
    case "relation":
      return (raw as { name?: string }).name ?? null;
    case "relationMany":
      return (raw as { name: string }[]).map((x) => x.name).join(", ") || null;
    default:
      return String(raw);
  }
}

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  return { title: getResource((await params).resource)?.plural ?? "Painel" };
}

const FLASH: Record<string, string> = { salvo: "Salvo! Já está atualizado no site.", removido: "Removido." };

export default async function ResourceList({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ q?: string; status?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { resource } = await params;
  const sp = await searchParams;
  const def = getResource(resource);
  if (!def) notFound();

  const hasPublished = def.fields.some((f) => f.name === "published");
  const q = sp.q?.trim();
  const where = {
    ...(q ? { [def.titleField]: { contains: q, mode: "insensitive" } } : {}),
    ...(hasPublished && sp.status === "rascunho" ? { published: false } : {}),
    ...(hasPublished && sp.status === "publicado" ? { published: true } : {}),
  };
  const [rows, total, drafts] = await Promise.all([
    delegate(def.model).findMany({ where, orderBy: def.orderBy, include: def.include, take: 300 }),
    delegate(def.model).count(),
    hasPublished ? delegate(def.model).count({ where: { published: false } }) : Promise.resolve(0),
  ]);
  const novo = def.gender === "a" ? "Nova" : "Novo";

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{def.plural}</h1>
          <p>{def.description}</p>
        </div>
        <div className="adm-head__actions">
          <Link href={`/admin/${def.key}/novo`} className="btn btn--magenta">
            <Icon name="plus" /> {novo} {def.singular}
          </Link>
        </div>
      </div>

      {sp.ok && FLASH[sp.ok] && (
        <div className="flash" role="status">
          <Icon name="check" /> {FLASH[sp.ok]}
        </div>
      )}

      <form className="toolbar" action={`/admin/${def.key}`}>
        <div className="search">
          <Icon name="search" />
          <input name="q" className="input" placeholder={`Buscar ${def.plural.toLowerCase()}`} defaultValue={q} aria-label="Buscar" />
        </div>
        {hasPublished && (
          <nav className="tabs" aria-label="Filtrar">
            <Link href={`/admin/${def.key}`} aria-current={!sp.status}>
              Todos <span className="count">{total}</span>
            </Link>
            <Link href={`/admin/${def.key}?status=publicado`} aria-current={sp.status === "publicado"}>
              No site
            </Link>
            <Link href={`/admin/${def.key}?status=rascunho`} aria-current={sp.status === "rascunho"}>
              Escondidos <span className="count">{drafts}</span>
            </Link>
          </nav>
        )}
      </form>

      <section className="panel rows">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <Icon name={def.icon} size={30} />
            <strong>{q ? "Nada encontrado" : `Nenhum ${def.singular} cadastrado`}</strong>
            {!q && (
              <Link href={`/admin/${def.key}/novo`} className="btn btn--sm">
                <Icon name="plus" /> Cadastrar agora
              </Link>
            )}
          </div>
        ) : (
          rows.map((row) => {
            const title = String(row[def.titleField] ?? "");
            const img = def.imageField ? (row[def.imageField] as string | null) : null;
            const pub = row.published as boolean | undefined;
            const publicUrl = def.publicPath?.(row);
            return (
              <div key={row.id} className="row-item">
                <span className="row-thumb">{img ? <img src={img} alt="" /> : <Icon name={def.icon} />}</span>
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
                  {hasPublished && (
                    <form action={togglePublished.bind(null, def.key, row.id, !pub)}>
                      <button className="status-toggle" data-on={pub} title={pub ? "Clique para esconder do site" : "Clique para publicar"}>
                        <i /> {pub ? "No site" : "Escondido"}
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
    </>
  );
}
