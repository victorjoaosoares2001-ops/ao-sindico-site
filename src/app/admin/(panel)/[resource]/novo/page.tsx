import Link from "next/link";
import { notFound } from "next/navigation";
import { saveResource } from "@/admin/actions";
import { toInputDate } from "@/admin/data";
import { loadOptions } from "@/admin/form-data";
import { getResource } from "@/admin/resources";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const def = getResource((await params).resource);
  return { title: def ? `${def.gender === "a" ? "Nova" : "Novo"} ${def.singular}` : "Painel" };
}

export default async function NewResource({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ ok?: string }> }) {
  await requireAdmin();
  const { resource } = await params;
  const { ok } = await searchParams;
  const def = getResource(resource);
  if (!def) notFound();
  const options = await loadOptions(def);
  const values: Record<string, unknown> = {};
  if (def.fields.some((f) => f.name === "publishedAt")) values.publishedAt = toInputDate(new Date(), true);

  return (
    <>
      <Link href={`/admin/${def.key}`} className="adm-back">
        <Icon name="arrowLeft" size={15} /> {def.plural}
      </Link>
      <div className="adm-head">
        <div>
          <h1>
            {def.gender === "a" ? "Nova" : "Novo"} {def.singular}
          </h1>
          <p>Preencha os campos e clique em Salvar. Campos com * são obrigatórios.</p>
        </div>
      </div>
      {ok && (
        <div className="flash" role="status">
          <Icon name="check" /> Salvo! Você já pode cadastrar o próximo.
        </div>
      )}
      <ResourceForm action={saveResource.bind(null, def.key, null)} fields={def.fields} values={values} options={options} isNew singular={def.singular} />
    </>
  );
}
