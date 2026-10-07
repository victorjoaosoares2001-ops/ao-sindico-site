"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";
import { CopyButton } from "./Buttons";

const ROLE_OPTIONS = [
  { value: "editor", label: "Conteúdo — matérias, Tira-Dúvidas, vídeos, agenda" },
  { value: "comercial", label: "Comercial — orçamentos, empresas, anúncios" },
  { value: "admin", label: "Administração — tudo, menos promover dono" },
  { value: "dono", label: "Dona/dono — tudo, inclusive equipe" },
];

function LinkBox({ state }: { state: FormState }) {
  if (!state.link) return null;
  return (
    <div className="link-box">
      <code>{state.link}</code>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <CopyButton text={state.link} label="Copiar link" />
        <a className="btn btn--sm btn--wa" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(`Seu acesso ao painel Ao Síndico: ${state.link}`)}`}>
          <Icon name="whatsapp" size={15} /> Enviar no WhatsApp
        </a>
      </div>
      <span className="hint">O link só aparece agora. Se perder, gere outro.</span>
    </div>
  );
}

export function InviteForm({ action, canOwner }: { action: (s: FormState, f: FormData) => Promise<FormState>; canOwner: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} style={{ display: "grid", gap: 14 }}>
      <label className="field">
        <span>Nome</span>
        <input name="name" className="input" required />
      </label>
      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" className="input" required />
      </label>
      <label className="field">
        <span>Perfil</span>
        <select name="role" className="select" defaultValue="editor">
          {ROLE_OPTIONS.filter((o) => canOwner || o.value !== "dono").map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {state.error && <div className="alert alert--error">{state.error}</div>}
      {state.ok && (
        <div className="alert alert--ok" role="status">
          <Icon name="check" /> {state.ok}
        </div>
      )}
      <LinkBox state={state} />
      <button className="btn" disabled={pending} style={{ justifySelf: "start" }}>
        <Icon name="send" size={15} /> {pending ? "Gerando…" : "Gerar convite"}
      </button>
    </form>
  );
}

export function MemberForm({
  action,
  resetAction,
  role,
  active,
  isMe,
  canOwner,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  resetAction: (s: FormState) => Promise<FormState>;
  role: string;
  active: boolean;
  isMe: boolean;
  canOwner: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [reset, resetFormAction, resetPending] = useActionState(resetAction, {});
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {!isMe && (
        <form action={formAction} className="member-form">
          <select name="role" className="select" defaultValue={role} aria-label="Perfil" disabled={!canOwner && role === "dono"}>
            {ROLE_OPTIONS.filter((o) => canOwner || o.value !== "dono" || role === "dono").map((o) => (
              <option key={o.value} value={o.value}>
                {o.label.split(" — ")[0]}
              </option>
            ))}
          </select>
          <label className="checks" style={{ margin: 0 }}>
            <label>
              <input type="checkbox" name="active" defaultChecked={active} /> Ativo
            </label>
          </label>
          <button className="btn btn--sm" disabled={pending}>
            Salvar
          </button>
        </form>
      )}
      <form action={resetFormAction}>
        <button className="btn btn--sm btn--ghost" disabled={resetPending}>
          <Icon name="key" size={15} /> Gerar link de nova senha
        </button>
      </form>
      {(state.error || reset.error) && <div className="alert alert--error">{state.error ?? reset.error}</div>}
      {state.ok && <div className="alert alert--ok">{state.ok}</div>}
      {reset.ok && <div className="alert alert--ok">{reset.ok}</div>}
      <LinkBox state={reset} />
    </div>
  );
}
