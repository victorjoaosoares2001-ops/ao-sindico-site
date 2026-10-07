"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";

/** Registrar contato feito com o síndico ou com uma empresa. */
export function ContactLogForm({ action, suppliers }: { action: (s: FormState, f: FormData) => Promise<FormState>; suppliers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="contact-form">
      <div className="contact-form__row">
        <select name="channel" className="select" defaultValue="whatsapp" aria-label="Canal">
          <option value="whatsapp">WhatsApp</option>
          <option value="telefone">Telefone</option>
          <option value="email">E-mail</option>
          <option value="outro">Outro</option>
        </select>
        <select name="supplierId" className="select" defaultValue="" aria-label="Com quem">
          <option value="">Com o síndico / solicitante</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              Com a empresa: {s.name}
            </option>
          ))}
        </select>
      </div>
      <textarea name="note" className="textarea" rows={2} style={{ minHeight: 70 }} placeholder="O que foi combinado? Ex.: síndica pediu retorno na segunda; empresa vai visitar dia 12." />
      {state.error && <div className="alert alert--error">{state.error}</div>}
      {state.ok && (
        <div className="alert alert--ok">
          <Icon name="check" /> {state.ok}
        </div>
      )}
      <button className="btn btn--sm" disabled={pending} style={{ justifySelf: "start" }}>
        <Icon name="plus" size={15} /> {pending ? "Registrando…" : "Registrar contato"}
      </button>
    </form>
  );
}
