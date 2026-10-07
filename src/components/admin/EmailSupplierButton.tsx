"use client";

import { useActionState } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";

/** Envia o pedido à empresa pelo e-mail do sistema (só aparece com e-mail configurado). */
export function EmailSupplierButton({ action }: { action: (s: FormState) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "contents" }}>
      <button className="btn btn--teal btn--sm" disabled={pending}>
        <Icon name="send" size={15} /> {pending ? "Enviando…" : "Enviar pelo sistema"}
      </button>
      {state.error && <span className="hint" style={{ color: "var(--magenta)", flexBasis: "100%" }}>{state.error}</span>}
      {state.ok && <span className="hint" style={{ color: "var(--teal-deep)", flexBasis: "100%" }}>{state.ok}</span>}
    </form>
  );
}
