"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, requestPasswordHelp } from "@/admin/actions";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

export function LoginForm() {
  const [forgot, setForgot] = useState(false);
  const [state, action, pending] = useActionState(login, {});
  const [help, helpAction, helpPending] = useActionState(requestPasswordHelp, {});

  if (forgot) {
    return (
      <form action={helpAction} className="login__card">
        <Logo tone="light" />
        <h1>Esqueci minha senha</h1>
        <p>Informe seu e-mail de acesso. A administração recebe o aviso no painel e te envia um link para criar uma nova senha.</p>
        <div style={{ display: "grid", gap: 14 }}>
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" className="input" required autoComplete="username" autoFocus />
          </label>
          {help.ok && <div className="alert alert--ok">{help.ok}</div>}
          <button className="btn btn--yellow btn--block" disabled={helpPending}>
            {helpPending ? "Enviando…" : "Avisar a administração"}
          </button>
          <button type="button" className="btn btn--glass btn--block" onClick={() => setForgot(false)}>
            Voltar ao login
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="login__card">
      <Logo tone="light" />
      <h1>Painel da equipe</h1>
      <p>Entre para gerenciar orçamentos, empresas, anúncios e conteúdos do portal.</p>
      <div style={{ display: "grid", gap: 14 }}>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" className="input" required autoComplete="username" autoFocus />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" className="input" required autoComplete="current-password" />
        </label>
        {state.error && (
          <div className="alert alert--error" role="alert">
            {state.error}
          </div>
        )}
        <button className="btn btn--yellow btn--block btn--arrow" disabled={pending} style={{ marginTop: 6 }}>
          {pending ? "Entrando…" : "Entrar"}
          <span className="btn__dot">
            <Icon name="arrowRight" size={16} />
          </span>
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 14 }}>
          <button type="button" onClick={() => setForgot(true)} style={{ background: "none", border: 0, color: "rgba(255,255,255,.75)", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
            Esqueci minha senha
          </button>
          <Link href="/" style={{ color: "rgba(255,255,255,.6)" }}>
            ← Voltar ao portal
          </Link>
        </div>
      </div>
    </form>
  );
}
