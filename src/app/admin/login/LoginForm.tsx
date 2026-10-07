"use client";

import { useActionState } from "react";
import { createFirstAdmin, login } from "@/admin/actions";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="login__card">
      <Logo tone="light" />
      <h1>Painel da equipe</h1>
      <p>Entre para gerenciar mensagens, fornecedores, anúncios e conteúdos do site.</p>
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
      </div>
    </form>
  );
}

/** Mostrada só enquanto não existe nenhum acesso ao painel. */
export function SetupForm() {
  const [state, action, pending] = useActionState(createFirstAdmin, {});
  return (
    <form action={action} className="login__card">
      <Logo tone="light" />
      <h1>Criar primeiro acesso</h1>
      <p>Defina o e-mail e a senha de quem vai administrar o painel. Depois, em “Equipe e senha”, você adiciona as funcionárias.</p>
      <div style={{ display: "grid", gap: 14 }}>
        <label className="field">
          <span>Seu nome</span>
          <input name="name" className="input" required autoComplete="name" autoFocus />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" className="input" required autoComplete="username" />
        </label>
        <label className="field">
          <span>Senha (mín. 8 caracteres)</span>
          <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </label>
        {state.error && (
          <div className="alert alert--error" role="alert">
            {state.error}
          </div>
        )}
        <button className="btn btn--yellow btn--block btn--arrow" disabled={pending} style={{ marginTop: 6 }}>
          {pending ? "Criando…" : "Criar acesso e entrar"}
          <span className="btn__dot">
            <Icon name="arrowRight" size={16} />
          </span>
        </button>
      </div>
    </form>
  );
}
