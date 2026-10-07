import "server-only";
import { delegate, toInputDate } from "./data";
import type { ResourceDef } from "./resources";

/** Opções dos campos de relação (ex.: lista de categorias para o fornecedor). */
export async function loadOptions(def: ResourceDef) {
  const out: Record<string, { id: string; label: string }[]> = {};
  for (const f of def.fields) {
    if ((f.type === "relation" || f.type === "relationMany") && f.relation) {
      const rows = await delegate(f.relation.model).findMany({
        select: { id: true, [f.relation.label]: true },
        orderBy: { [f.relation.label]: "asc" },
      });
      out[f.name] = rows.map((r) => ({ id: r.id, label: String(r[f.relation!.label]) }));
    }
  }
  return out;
}

/** Converte o registro do banco para valores de formulário. */
export async function loadValues(def: ResourceDef, id: string) {
  const include = Object.fromEntries(def.fields.filter((f) => f.type === "relationMany").map((f) => [f.name, { select: { id: true } }]));
  const row = await delegate(def.model).findUnique({ where: { id }, include: Object.keys(include).length ? include : undefined });
  if (!row) return null;
  const values: Record<string, unknown> = { ...row };
  for (const f of def.fields) {
    if (f.type === "date" || f.type === "datetime") values[f.name] = toInputDate(row[f.name], f.type === "datetime");
    if (f.type === "relationMany") values[f.name] = ((row[f.name] as { id: string }[]) ?? []).map((x) => x.id);
  }
  return { row, values };
}
