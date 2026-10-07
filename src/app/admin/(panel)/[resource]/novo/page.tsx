import Link from "next/link";
import { notFound } from "next/navigation";
import { saveResource } from "@/admin/actions";
import { toInputDate } from "@/admin/data";
import { loadOptions } from "@/admin/form-data";
import { getResource } from "@/admin/resources";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const def = getResource((await params).resource);
  return { title: def ? `${def.gender === "a" ? "Nova" : "Novo"} ${def.singular}` : "Painel" };
}

export default async function NewResource({
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
  const options = await loadOptions(def);

  // pré-preenchimento pela URL (ex.: /admin/anuncios/novo?supplierId=… vindo do perfil da empresa)
  const values: Record<string, unknown> = {};
  for (const f of def.urlFilters ?? []) if (sp[f]) values[f] = sp[f];
  if (def.fields.some((f) => f.name === "publishedAt")) values.publishedAt = toInputDate(new Date(), true);
  let back: string | undefined;
  let context: string | null = null;
  if (def.model === "campaign" && sp.supplierId) {
    const s = await db.supplier.findUnique({ where: { id: sp.supplierId }, select: { id: true, name: true } });
    if (s) {
      values.title = `${s.name} · banner`;
      back = `/admin/fornecedores/${s.id}`;
      context = `Anúncio da empresa ${s.name}`;
    }
  }

  return (
    <>
      <Link href={back ?? `/admin/${def.key}`} className="adm-back">
        <Icon name="arrowLeft" size={15} /> {back ? "Voltar para a empresa" : def.plural}
      </Link>
      <div className="adm-head">
        <div>
          <h1>
            {def.gender === "a" ? "Nova" : "Novo"} {def.singular}
          </h1>
          <p>{context ?? "Preencha os campos e clique em Salvar. Campos com * são obrigatórios."}</p>
        </div>
      </div>
      {sp.ok && (
        <div className="flash" role="status">
          <Icon name="check" /> Salvo! Você já pode cadastrar o próximo.
        </div>
      )}
      <ResourceForm action={saveResource.bind(null, def.key, null)} fields={def.fields} values={values} options={options} isNew singular={def.singular} back={back} />
    </>
  );
}
