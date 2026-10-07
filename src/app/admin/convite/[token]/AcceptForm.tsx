"use client";

import { useActionState } from "react";
import type { FormState } from "@/admin/actions";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

export function AcceptForm({
  action,
  isInvite,
  email,
  name,
  roleLabel,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  isInvite: boolean;
  email: string;
  name: string;
  roleLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="login__card">
      <Logo tone="light" />
      <h1>{isInvite ? "Criar seu acesso" : "Criar nova senha"}</h1>
      <p>
        {isInvite
          ? `Você foi convidada(o) para o painel do Ao Síndico${roleLabel ? ` com perfil ${roleLabel}` : ""}. Defina seus dados de acesso.`
          : `Defina uma nova senha para ${email}.`}
      </p>
      <div style={{ display: "grid", gap: 14 }}>
        {isInvite && (
          <>
            <label className="field">
              <span>Seu nome</span>
              <input name="name" className="input" required defaultValue={name} autoComplete="name" />
            </label>
            <label className="field">
              <span>E-mail (será seu login)</span>
              <input name="email" type="email" className="input" required defaultValue={email} autoComplete="username" />
            </label>
          </>
        )}
        <label className="field">
          <span>Senha (mín. 10 caracteres)</span>
          <input name="password" type="password" className="input" required minLength={10} autoComplete="new-password" />
        </label>
        <label className="field">
          <span>Repita a senha</span>
          <input name="confirm" type="password" className="input" required minLength={10} autoComplete="new-password" />
        </label>
        {state.error && (
          <div className="alert alert--error" role="alert">
            {state.error}
          </div>
        )}
        <button className="btn btn--yellow btn--block btn--arrow" disabled={pending} style={{ marginTop: 6 }}>
          {pending ? "Salvando…" : isInvite ? "Criar acesso e entrar" : "Salvar e entrar"}
          <span className="btn__dot">
            <Icon name="arrowRight" size={16} />
          </span>
        </button>
      </div>
    </form>
  );
}
