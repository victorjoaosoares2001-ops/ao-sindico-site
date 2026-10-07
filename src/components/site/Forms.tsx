"use client";

import { useActionState } from "react";
import { Icon } from "@/components/Icon";
import { submitContact, subscribe, type PublicFormState } from "@/lib/public-actions";

export function ContactForm({ type = "anunciar", source }: { type?: "anunciar" | "contato"; source?: string }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitContact, {});

  if (state.ok) {
    return (
      <div className="quote__done" role="status">
        <span className="quote__done-icon">
          <Icon name="check" size={26} />
        </span>
        <h2 style={{ fontSize: 26 }}>Recebemos sua mensagem</h2>
        <p style={{ color: "var(--ink-2)" }}>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="source" value={source ?? ""} />
      <input type="text" name="empresa_site" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="row">
        <label className="field">
          <span>Seu nome *</span>
          <input name="name" className="input" required autoComplete="name" />
        </label>
        <label className="field">
          <span>{type === "anunciar" ? "Empresa *" : "Condomínio / empresa"}</span>
          <input name="company" className="input" required={type === "anunciar"} autoComplete="organization" />
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>E-mail *</span>
          <input name="email" type="email" className="input" required autoComplete="email" />
        </label>
        <label className="field">
          <span>WhatsApp *</span>
          <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" />
        </label>
      </div>
      {type === "anunciar" ? (
        <label className="field">
          <span>Interesse</span>
          <select name="subject" className="select" defaultValue="Quero anunciar no portal">
            <option>Quero anunciar no portal</option>
            <option>Quero aparecer no guia de fornecedores</option>
            <option>Quero patrocinar um evento</option>
            <option>Quero publicar uma matéria / ser colunista</option>
            <option>Outro assunto</option>
          </select>
        </label>
      ) : (
        <label className="field">
          <span>Assunto</span>
          <input name="subject" className="input" />
        </label>
      )}
      <label className="field">
        <span>Mensagem</span>
        <textarea name="body" className="textarea" rows={4} placeholder="Conte um pouco sobre sua empresa e seu objetivo" />
      </label>
      {state.error && (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      )}
      <button className="btn btn--arrow" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Enviando…" : "Enviar mensagem"}
        <span className="btn__dot">
          <Icon name="send" size={15} />
        </span>
      </button>
    </form>
  );
}

export function NewsletterForm() {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(subscribe, {});
  if (state.ok) {
    return (
      <p className="alert alert--ok" role="status">
        <Icon name="check" /> {state.message}
      </p>
    );
  }
  return (
    <form action={action}>
      <input type="text" name="empresa_site" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="newsletter">
        <label className="sr-only" htmlFor="nl-email">
          E-mail
        </label>
        <input id="nl-email" name="email" type="email" placeholder="Seu melhor e-mail" required autoComplete="email" />
        <button className="btn" disabled={pending}>
          {pending ? "…" : "Assinar"}
        </button>
      </div>
      {state.error && <p style={{ marginTop: 8, fontSize: 14, color: "var(--magenta)" }}>{state.error}</p>}
    </form>
  );
}
