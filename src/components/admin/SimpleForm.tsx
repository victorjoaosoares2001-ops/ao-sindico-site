"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";

export function SimpleForm({
  action,
  submit,
  reset,
  children,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submit: string;
  reset?: boolean;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && reset) ref.current?.reset();
  }, [state, reset]);
  return (
    <form ref={ref} action={formAction} style={{ display: "grid", gap: 14 }}>
      {children}
      {state.error && <div className="alert alert--error">{state.error}</div>}
      {state.ok && (
        <div className="alert alert--ok" role="status">
          <Icon name="check" /> {state.ok}
        </div>
      )}
      <button className="btn" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Salvando…" : submit}
      </button>
    </form>
  );
}
