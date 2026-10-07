"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  findCertificate,
  registerForEvent,
  submitContact,
  submitQuestion,
  submitReview,
  subscribe,
  type PublicFormState,
} from "@/lib/public-actions";

/** Campos anti-robô comuns a todos os formulários públicos. */
function Guard() {
  return (
    <>
      <input type="text" name="hp_7f3" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    </>
  );
}

function Done({ message, title }: { message?: string; title: string }) {
  return (
    <div className="quote__done" role="status">
      <span className="quote__done-icon">
        <Icon name="check" size={26} />
      </span>
      <h2 style={{ fontSize: 24 }}>{title}</h2>
      <p style={{ color: "var(--ink-2)" }}>{message}</p>
    </div>
  );
}

const Err = ({ state }: { state: PublicFormState }) =>
  state.error ? (
    <div className="alert alert--error" role="alert">
      {state.error}
    </div>
  ) : null;

export function ContactForm({ type = "anunciar", source, interests }: { type?: "anunciar" | "contato"; source?: string; interests?: string[] }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitContact, {});
  if (state.ok) return <Done title="Recebemos sua mensagem" message={state.message} />;
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="source" value={source ?? ""} />
      <Guard />
      <div className="row">
        <label className="field">
          <span>Seu nome *</span>
          <input name="name" className="input" required autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          <span>{type === "anunciar" ? "Empresa *" : "Condomínio / empresa"}</span>
          <input name="company" className="input" required={type === "anunciar"} autoComplete="organization" maxLength={160} />
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>E-mail *</span>
          <input name="email" type="email" className="input" required autoComplete="email" maxLength={160} />
        </label>
        <label className="field">
          <span>WhatsApp *</span>
          <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" />
        </label>
      </div>
      {type === "anunciar" ? (
        <div className="row">
          <label className="field">
            <span>Interesse</span>
            <select name="subject" className="select">
              {(interests?.length ? interests : ["Quero anunciar no portal"]).map((i) => (
                <option key={i}>{i}</option>
              ))}
              <option>Outro assunto</option>
            </select>
          </label>
          <label className="field">
            <span>Cidade de atuação</span>
            <input name="city" className="input" maxLength={80} />
          </label>
        </div>
      ) : (
        <label className="field">
          <span>Assunto</span>
          <input name="subject" className="input" maxLength={160} />
        </label>
      )}
      <label className="field">
        <span>Mensagem</span>
        <textarea name="body" className="textarea" rows={4} maxLength={4000} placeholder={type === "anunciar" ? "Conte sobre sua empresa, serviços e região atendida" : "Como podemos ajudar?"} />
      </label>
      <Err state={state} />
      <button className="btn btn--arrow" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Enviando…" : type === "anunciar" ? "Falar com o comercial" : "Enviar mensagem"}
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
      <Guard />
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

export function QuestionForm({ sections }: { sections: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitQuestion, {});
  if (state.ok) return <Done title="Pergunta enviada" message={state.message} />;
  return (
    <form action={action} className="form-grid">
      <Guard />
      <label className="field">
        <span>Sua dúvida *</span>
        <input name="title" className="input" required minLength={10} maxLength={200} placeholder="Ex.: O condomínio pode multar por barulho depois das 22h?" />
      </label>
      <label className="field">
        <span>Detalhes (opcional)</span>
        <textarea name="body" className="textarea" rows={4} maxLength={3000} placeholder="Conte o contexto. Não inclua dados pessoais de terceiros." />
      </label>
      <div className="row">
        <label className="field">
          <span>Assunto</span>
          <select name="sectionId" className="select" defaultValue="">
            <option value="">Não sei / outro</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Cidade</span>
          <input name="city" className="input" maxLength={80} />
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>Seu nome *</span>
          <input name="name" className="input" required autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          <span>E-mail (para avisarmos da resposta)</span>
          <input name="email" type="email" className="input" autoComplete="email" maxLength={160} />
        </label>
      </div>
      <p className="hint" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
        Publicamos só a pergunta e a resposta, sem seu e-mail.
      </p>
      <Err state={state} />
      <button className="btn btn--arrow" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Enviando…" : "Enviar pergunta"}
        <span className="btn__dot">
          <Icon name="send" size={15} />
        </span>
      </button>
    </form>
  );
}

export function ReviewForm({ action: bound }: { action: (s: PublicFormState, f: FormData) => Promise<PublicFormState> }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(bound, {});
  const [rating, setRating] = useState(5);
  if (state.ok) return <Done title="Obrigado!" message={state.message} />;
  return (
    <form action={action} className="form-grid">
      <Guard />
      <div className="field">
        <span>Sua nota</span>
        <div className="stars-input" role="radiogroup" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={rating === n} data-on={n <= rating} onClick={() => setRating(n)} aria-label={`${n} estrela(s)`}>
              <Icon name="star" size={24} />
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>
      <label className="field">
        <span>Comentário</span>
        <textarea name="comment" className="textarea" rows={3} maxLength={2000} placeholder="Como foi o atendimento e o serviço?" />
      </label>
      <div className="row">
        <label className="field">
          <span>Seu nome *</span>
          <input name="name" className="input" required maxLength={120} />
        </label>
        <label className="field">
          <span>Condomínio</span>
          <input name="condo" className="input" maxLength={160} />
        </label>
      </div>
      <label className="field">
        <span>E-mail (não aparece no site)</span>
        <input name="email" type="email" className="input" maxLength={160} />
      </label>
      <Err state={state} />
      <button className="btn" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}

export function RegistrationForm({ action: bound, eventTitle }: { action: (s: PublicFormState, f: FormData) => Promise<PublicFormState>; eventTitle: string }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(bound, {});
  if (state.ok) return <Done title="Inscrição confirmada!" message={state.message} />;
  return (
    <form action={action} className="form-grid" aria-label={`Inscrição: ${eventTitle}`}>
      <Guard />
      <label className="field">
        <span>Nome completo *</span>
        <input name="name" className="input" required autoComplete="name" maxLength={120} />
      </label>
      <div className="row">
        <label className="field">
          <span>E-mail *</span>
          <input name="email" type="email" className="input" required autoComplete="email" maxLength={160} />
        </label>
        <label className="field">
          <span>WhatsApp *</span>
          <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" />
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>Você é</span>
          <select name="role" className="select" defaultValue="Síndico(a)">
            <option>Síndico(a)</option>
            <option>Síndico(a) profissional</option>
            <option>Subsíndico(a)</option>
            <option>Conselheiro(a)</option>
            <option>Administradora</option>
            <option>Fornecedor</option>
            <option>Outro</option>
          </select>
        </label>
        <label className="field">
          <span>Nº de unidades</span>
          <input name="units" className="input" inputMode="numeric" maxLength={10} />
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>Condomínio / empresa</span>
          <input name="condo" className="input" maxLength={160} />
        </label>
        <label className="field">
          <span>Cidade</span>
          <input name="city" className="input" maxLength={80} />
        </label>
      </div>
      <Err state={state} />
      <button className="btn btn--magenta btn--arrow" disabled={pending} style={{ justifySelf: "start" }}>
        {pending ? "Enviando…" : "Confirmar inscrição"}
        <span className="btn__dot">
          <Icon name="check" size={15} />
        </span>
      </button>
    </form>
  );
}

export function CertificateForm({ action: bound }: { action: (s: PublicFormState, f: FormData) => Promise<PublicFormState> }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(bound, {});
  return (
    <form action={action} className="form-grid">
      <label className="field">
        <span>E-mail usado na inscrição</span>
        <input name="email" type="email" className="input" required autoComplete="email" />
      </label>
      <Err state={state} />
      {state.ok && state.link ? (
        <a href={state.link} target="_blank" rel="noopener" className="btn btn--teal" style={{ justifySelf: "start" }}>
          <Icon name="file" size={16} /> Baixar certificado
        </a>
      ) : (
        <button className="btn btn--ghost" disabled={pending} style={{ justifySelf: "start" }}>
          {pending ? "Procurando…" : "Buscar certificado"}
        </button>
      )}
    </form>
  );
}

/** Vídeo leve: mostra a capa do YouTube e só carrega o player ao clicar. */
export function VideoPlayer({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="video-card__frame">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <button className="video-card__play" onClick={() => setPlay(true)} aria-label={`Assistir: ${title}`}>
            <span>
              <Icon name="youtube" size={26} />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
