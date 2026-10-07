"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";

type Supplier = { id: string; name: string; city: string | null; categories: string[] };

const STATUSES = [
  { value: "novo", label: "Responder (novo)" },
  { value: "andamento", label: "Em andamento" },
  { value: "respondido", label: "Respondido / concluído" },
  { value: "arquivado", label: "Arquivado" },
];

const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function MessageForm({
  action,
  status,
  notes,
  assignedTo,
  team,
  isQuote,
  category,
  city,
  selected,
  suppliers,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  status: string;
  notes: string;
  assignedTo: string;
  team: string[];
  isQuote: boolean;
  category: string | null;
  city: string | null;
  selected: string[];
  suppliers: Supplier[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [filter, setFilter] = useState("");
  const [picked, setPicked] = useState(new Set(selected));

  // já relacionadas, mesma categoria e mesma cidade primeiro (ordem fixa: não pula ao marcar)
  const list = useMemo(() => {
    const f = norm(filter);
    const score = (s: Supplier) =>
      (selected.includes(s.id) ? 4 : 0) + (category && s.categories.includes(category) ? 2 : 0) + (city && norm(s.city) === norm(city) ? 1 : 0);
    return suppliers
      .filter((s) => !f || norm(s.name).includes(f) || s.categories.some((c) => norm(c).includes(f)) || norm(s.city).includes(f))
      .sort((a, b) => score(b) - score(a));
  }, [filter, suppliers, category, city, selected]);

  return (
    <form action={formAction} className="panel panel__pad" style={{ display: "grid", gap: 18, alignSelf: "start", position: "sticky", top: 16 }}>
      <label className="field">
        <span>Situação</span>
        <select name="status" className="select" defaultValue={status}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Responsável</span>
        <select name="assignedTo" className="select" defaultValue={assignedTo}>
          <option value="">— Ninguém ainda —</option>
          {team.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Observações internas</span>
        <textarea name="notes" className="textarea" defaultValue={notes} placeholder="Só a equipe vê." rows={4} />
      </label>

      {isQuote && (
        <div className="field">
          <span>Empresas relacionadas ({picked.size})</span>
          <input className="input" placeholder="Filtrar por nome, categoria ou cidade…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minHeight: 42 }} />
          <div className="sup-pick">
            {list.map((s) => (
              <label key={s.id}>
                <input
                  type="checkbox"
                  value={s.id}
                  checked={picked.has(s.id)}
                  onChange={(e) => {
                    const next = new Set(picked);
                    if (e.target.checked) next.add(s.id);
                    else next.delete(s.id);
                    setPicked(next);
                  }}
                />
                {s.name}
                <small>
                  {category && s.categories.includes(category) ? "★ mesma categoria" : ""}
                  {city && norm(s.city) === norm(city) ? " · mesma cidade" : !category || !s.categories.includes(category) ? (s.city ?? "") : ""}
                </small>
              </label>
            ))}
          </div>
          {[...picked].map((id) => (
            <input key={id} type="hidden" name="suppliers" value={id} />
          ))}
        </div>
      )}

      {state.error && <div className="alert alert--error">{state.error}</div>}
      {state.ok && (
        <div className="alert alert--ok" role="status">
          <Icon name="check" /> {state.ok}
        </div>
      )}
      <button className="btn btn--yellow" disabled={pending}>
        <Icon name="check" /> {pending ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
