"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/admin/actions";
import type { FieldDef } from "@/admin/resources";
import { Icon } from "@/components/Icon";
import { IconField, ImageField, MarkdownField, Switch } from "./Fields";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  fields: FieldDef[];
  values: Record<string, unknown>;
  options: Record<string, { id: string; label: string }[]>;
  isNew: boolean;
  singular: string;
  /** volta para esta página depois de salvar (ex.: perfil da empresa) */
  back?: string;
};

function SelectWithHint({ f, value }: { f: FieldDef; value: string }) {
  const [current, setCurrent] = useState(value || String(f.defaultValue ?? ""));
  const hint = f.options?.find((o) => o.value === current)?.hint;
  return (
    <label className="field">
      <span>
        {f.label} {f.required && <span className="req">*</span>}
      </span>
      <select name={f.name} className="select" value={current} onChange={(e) => setCurrent(e.target.value)}>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? (
        <span className="hint" style={{ color: "var(--teal-deep)", fontWeight: 600 }}>
          <Icon name="image" size={13} style={{ display: "inline", verticalAlign: -2 }} /> {hint}
        </span>
      ) : (
        f.hint && <span className="hint">{f.hint}</span>
      )}
    </label>
  );
}

function Rating({ f, value }: { f: FieldDef; value: string }) {
  const [v, setV] = useState(Number(value || f.defaultValue || 5));
  return (
    <div className="field">
      <span>{f.label}</span>
      <div className="stars-input" role="radiogroup" aria-label={f.label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} aria-checked={v === n} role="radio" data-on={n <= v} onClick={() => setV(n)} aria-label={`${n} estrela(s)`}>
            <Icon name="star" size={24} />
          </button>
        ))}
      </div>
      <input type="hidden" name={f.name} value={v} />
    </div>
  );
}

function Field({ f, value, options }: { f: FieldDef; value: unknown; options?: { id: string; label: string }[] }) {
  const str = value === null || value === undefined ? "" : String(value);
  const label = (
    <span>
      {f.label} {f.required && <span className="req">*</span>}
    </span>
  );
  const hint = f.hint ? <span className="hint">{f.hint}</span> : null;

  switch (f.type) {
    case "image":
      return <ImageField name={f.name} value={str} label={f.label} hint={f.hint} required={f.required} />;
    case "markdown":
      return <MarkdownField name={f.name} value={str} label={f.label} hint={f.hint} />;
    case "icon":
      return <IconField name={f.name} value={str} label={f.label} />;
    case "bool":
      return <Switch name={f.name} label={f.label} hint={f.hint} defaultChecked={Boolean(value)} />;
    case "rating":
      return <Rating f={f} value={str} />;
    case "textarea":
      return (
        <label className="field">
          {label}
          <textarea name={f.name} className="textarea" defaultValue={str} placeholder={f.placeholder} rows={4} />
          {hint}
        </label>
      );
    case "select":
      return <SelectWithHint f={f} value={str} />;
    case "relation":
      return (
        <label className="field">
          {label}
          <select name={f.name} className="select" defaultValue={str} required={f.required}>
            <option value="">— Nenhum —</option>
            {options?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {hint}
        </label>
      );
    case "relationMany": {
      const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
      return (
        <div className="field">
          {label}
          {options && options.length > 0 ? (
            <div className="checks">
              {options.map((o) => (
                <label key={o.id}>
                  <input type="checkbox" name={f.name} value={o.id} defaultChecked={selected.has(o.id)} />
                  {o.label}
                </label>
              ))}
            </div>
          ) : (
            <span className="hint">Nenhuma opção cadastrada ainda.</span>
          )}
          {hint}
        </div>
      );
    }
    case "date":
    case "datetime":
      return (
        <label className="field">
          {label}
          <input type={f.type === "date" ? "date" : "datetime-local"} name={f.name} className="input" defaultValue={str} required={f.required} />
          {hint}
        </label>
      );
    case "number":
      return (
        <label className="field">
          {label}
          <input type="number" name={f.name} className="input" defaultValue={str || String(f.defaultValue ?? 0)} inputMode="numeric" />
          {hint}
        </label>
      );
    case "slug":
      return (
        <label className="field">
          {label}
          <input name={f.name} className="input" defaultValue={str} placeholder="automático" />
          {hint}
        </label>
      );
    default:
      return (
        <label className="field">
          {label}
          <input type={f.type === "url" ? "url" : "text"} name={f.name} className="input" defaultValue={str} placeholder={f.placeholder} required={f.required} />
          {hint}
        </label>
      );
  }
}

export function ResourceForm({ action, fields, values, options, isNew, singular, back }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const main = fields.filter((f) => !f.side);
  const side = fields.filter((f) => f.side);

  const render = (f: FieldDef) => {
    const v = values[f.name] ?? (isNew ? f.defaultValue : undefined);
    return (
      <div key={f.name} className={f.half ? "" : "full"}>
        <Field f={f} value={v} options={options[f.name]} />
      </div>
    );
  };

  return (
    <form action={formAction}>
      {back && <input type="hidden" name="__back" value={back} />}
      {state.error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          <Icon name="x" /> {state.error}
        </div>
      )}
      <div className="edit-grid">
        <div className="panel panel__pad">
          <div className="fields">{main.map(render)}</div>
        </div>
        {side.length > 0 && (
          <div className="panel panel__pad">
            <div className="side-fields">{side.map(render)}</div>
          </div>
        )}
      </div>
      <div className="save-bar">
        <span>{isNew ? `Novo ${singular}` : "Alterações aparecem no site assim que você salvar."}</span>
        <div className="save-bar__actions">
          {isNew && !back && (
            <button className="btn btn--glass" name="__next" value="novo" disabled={pending}>
              Salvar e criar outro
            </button>
          )}
          <button className="btn btn--yellow" name="__next" value="lista" disabled={pending}>
            <Icon name="check" /> {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}
