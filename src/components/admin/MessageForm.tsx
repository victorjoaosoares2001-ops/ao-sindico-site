"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";

type Supplier = { id: string; name: string; city: string | null; categories: string[] };

const STATUSES = [
  { value: "novo", label: "Responder (novo)" },
  { value: "andamento", label: "Em andamento" },
  { value: "respondido", label: "Respondido" },
  { value: "arquivado", label: "Arquivado" },
];

export function MessageForm({
  action,
  status,
  notes,
  isQuote,
  category,
  selected,
  suppliers,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  status: string;
  notes: string;
  isQuote: boolean;
  category: string | null;
  selected: string[];
  suppliers: Supplier[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [filter, setFilter] = useState("");
  const [picked, setPicked] = useState(new Set(selected));

  // já relacionadas e da mesma categoria do pedido aparecem primeiro (ordem fixa, não pula ao marcar)
  const list = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const score = (s: Supplier) => (selected.includes(s.id) ? 2 : 0) + (category && s.categories.includes(category) ? 1 : 0);
    return suppliers
      .filter((s) => !f || s.name.toLowerCase().includes(f) || s.categories.some((c) => c.toLowerCase().includes(f)) || s.city?.toLowerCase().includes(f))
      .sort((a, b) => score(b) - score(a));
  }, [filter, suppliers, category, selected]);

  return (
    <form action={formAction} className="panel panel__pad" style={{ display: "grid", gap: 18, alignSelf: "start" }}>
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
        <span>Observações internas</span>
        <textarea name="notes" className="textarea" defaultValue={notes} placeholder="Ex.: liguei dia 10, pediu retorno na segunda. (Só a equipe vê.)" rows={4} />
      </label>

      {isQuote && (
        <div className="field">
          <span>Empresas relacionadas ({picked.size})</span>
          <input className="input" placeholder="Filtrar empresas…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minHeight: 42 }} />
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
                <small>{category && s.categories.includes(category) ? "★ mesma categoria" : s.city ?? ""}</small>
              </label>
            ))}
          </div>
          {[...picked].map((id) => (
            <input key={id} type="hidden" name="suppliers" value={id} />
          ))}
          <span className="hint">Marque as empresas e salve. Depois envie o pedido a cada uma pelos botões ao lado.</span>
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
