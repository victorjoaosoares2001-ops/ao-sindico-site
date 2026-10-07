import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteResource, saveResource } from "@/admin/actions";
import { loadOptions, loadValues } from "@/admin/form-data";
import { getResource } from "@/admin/resources";
import { ConfirmButton } from "@/components/admin/Buttons";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const def = getResource((await params).resource);
  return { title: def ? `Editar ${def.singular}` : "Painel" };
}

export default async function EditResource({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<{ ok?: string }> }) {
  await requireAdmin();
  const { resource, id } = await params;
  const { ok } = await searchParams;
  const def = getResource(resource);
  if (!def) notFound();
  const [loaded, options] = await Promise.all([loadValues(def, id), loadOptions(def)]);
  if (!loaded) notFound();
  const { row, values } = loaded;
  const title = String(row[def.titleField] ?? "");
  const publicUrl = def.publicPath?.(row);

  return (
    <>
      <Link href={`/admin/${def.key}`} className="adm-back">
        <Icon name="arrowLeft" size={15} /> {def.plural}
      </Link>
      <div className="adm-head">
        <div>
          <h1>{title}</h1>
          <p>Última alteração em {formatDateTime(row.updatedAt as Date)}</p>
        </div>
        <div className="adm-head__actions">
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener" className="btn btn--ghost">
              <Icon name="eye" /> Ver no site
            </a>
          )}
          <form action={deleteResource.bind(null, def.key, id)}>
            <ConfirmButton message={`Remover “${title}”? Essa ação não pode ser desfeita.`} className="btn btn--ghost" icon="trash">
              Remover
            </ConfirmButton>
          </form>
        </div>
      </div>
      {ok && (
        <div className="flash" role="status">
          <Icon name="check" /> Salvo!
        </div>
      )}
      <ResourceForm action={saveResource.bind(null, def.key, id)} fields={def.fields} values={values} options={options} isNew={false} singular={def.singular} />
    </>
  );
}
