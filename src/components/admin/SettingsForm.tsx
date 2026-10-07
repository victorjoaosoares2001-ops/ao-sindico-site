"use client";

import { useActionState } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";
import { ImageField } from "./Fields";

type Group = { title: string; hint: string; fields: { key: string; label: string; type: string }[] };

export function SettingsForm({ action, groups, values }: { action: (s: FormState, f: FormData) => Promise<FormState>; groups: Group[]; values: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 18 }}>
      {state.ok && (
        <div className="flash" role="status">
          <Icon name="check" /> {state.ok}
        </div>
      )}
      {state.error && <div className="alert alert--error">{state.error}</div>}
      {groups.map((g) => (
        <section key={g.title} className="panel panel__pad">
          <div className="panel__title" style={{ display: "block" }}>
            {g.title}
            <div className="hint" style={{ fontWeight: 400, marginTop: 2 }}>
              {g.hint}
            </div>
          </div>
          <div className="fields">
            {g.fields.map((f) =>
              f.type === "image" ? (
                <div key={f.key} className="full">
                  <ImageField name={f.key} value={values[f.key]} label={f.label} />
                </div>
              ) : (
                <label key={f.key} className={`field${f.type === "textarea" ? " full" : ""}`}>
                  <span>{f.label}</span>
                  {f.type === "textarea" ? (
                    <textarea name={f.key} className="textarea" defaultValue={values[f.key]} rows={3} />
                  ) : (
                    <input name={f.key} className="input" defaultValue={values[f.key]} />
                  )}
                </label>
              ),
            )}
          </div>
        </section>
      ))}
      <div className="save-bar">
        <span>As mudanças aparecem no site assim que você salvar.</span>
        <div className="save-bar__actions">
          <button className="btn btn--yellow" disabled={pending}>
            <Icon name="check" /> {pending ? "Salvando…" : "Salvar textos"}
          </button>
        </div>
      </div>
    </form>
  );
}
