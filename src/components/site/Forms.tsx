"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { FREE_ROLES } from "@/lib/event-roles";
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

/**
 * Depois de gravar no painel, abre o WhatsApp da Ao Síndico com o resumo já escrito,
 * para a equipe receber direto no celular e direcionar a quem cuida.
 */
export function WhatsappDone({ message, title, link, children }: { message?: string; title: string; link?: string; children?: React.ReactNode }) {
  useEffect(() => {
    if (!link) return;
    const t = setTimeout(() => {
      window.location.href = link;
    }, 1200);
    return () => clearTimeout(t);
  }, [link]);
  return (
    <div className="quote__done" role="status">
      <span className="quote__done-icon">
        <Icon name="check" size={26} />
      </span>
      <h2 style={{ fontSize: 24 }}>{title}</h2>
      <p style={{ color: "inherit", opacity: 0.85 }}>{message}</p>
      {link && (
        <a href={link} target="_blank" rel="noopener" className="btn btn--wa" style={{ justifySelf: "start", background: "#25D366", color: "#fff" }}>
          <Icon name="whatsapp" size={18} /> Enviar pelo WhatsApp
        </a>
      )}
      {children}
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
  if (state.ok) return <WhatsappDone title="Recebemos sua mensagem" message={state.message} link={state.link} />;
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
      <label className="field">
        <span>WhatsApp com DDD *</span>
        <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" pattern="[\d\s()+\-]{10,}" title="Inclua o DDD" />
      </label>
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
  if (state.ok) return <WhatsappDone title="Pergunta enviada" message={state.message} link={state.link} />;
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
          <span>WhatsApp com DDD *</span>
          <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" pattern="[\d\s()+\-]{10,}" title="Inclua o DDD" />
        </label>
      </div>
      <p className="hint" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
        Publicamos só a pergunta e a resposta. Seu nome e WhatsApp ficam só com a nossa equipe.
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

const REG_STEPS = ["Perfil", "Seus dados", "Condomínio"];
const ROLE_ICONS: Record<string, IconName> = {
  "Síndico(a)": "key",
  "Síndico(a) profissional": "briefcase",
  "Subsíndico(a)": "users",
  "Conselheiro(a)": "scale",
  Administradora: "building",
  "Gerente predial": "settings",
  "Zelador(a)": "wrench",
};

/** Inscrição em evento, em etapas. Só as categorias gratuitas; empresa vai para o bloco de parceiros (#parceiros). */
export function RegistrationForm({ action: bound, eventTitle, partners }: { action: (s: PublicFormState, f: FormData) => Promise<PublicFormState>; eventTitle: string; partners?: boolean }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(bound, {});
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const refs = useRef<(HTMLFieldSetElement | null)[]>([]);
  if (state.ok)
    return (
      <div className="card">
        <Done title={state.message?.startsWith("Este e-mail já") ? "Você já está inscrito(a)" : "Inscrição confirmada!"} message={state.message} />
      </div>
    );

  const goTo = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => {
      const top = formRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const next = () => {
    const invalid = refs.current[step]?.querySelector<HTMLInputElement>(":invalid");
    if (invalid) return invalid.reportValidity();
    goTo(step + 1);
  };
  const fs = (i: number) => ({
    ref: (el: HTMLFieldSetElement | null) => {
      refs.current[i] = el;
    },
    hidden: step !== i,
    style: { border: 0, padding: 0, margin: 0, minWidth: 0 },
  });

  return (
    <form ref={formRef} action={action} id="inscricao" className="reg quote quote--dark wizard" aria-label={`Inscrição: ${eventTitle}`}>
      <div className="quote__head">
        <div>
          <h2>Inscrição gratuita</h2>
          <p>Para síndicos e equipes de condomínio. Leva menos de um minuto.</p>
        </div>
      </div>
      <ol className="wizard__progress" aria-label={`Etapa ${step + 1} de ${REG_STEPS.length}: ${REG_STEPS[step]}`}>
        {REG_STEPS.map((s, i) => (
          <li key={s} data-state={i < step ? "done" : i === step ? "current" : "todo"} aria-current={i === step ? "step" : undefined}>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <Guard />

      <fieldset {...fs(0)}>
        <div className="quote__body">
          <div className="field">
            <span>Você é:</span>
            <div className="choice-grid" role="radiogroup" aria-label="Você é">
              {FREE_ROLES.map((r, i) => (
                <label key={r} className="choice">
                  {/* avança sozinho ao escolher, como no pedido de orçamento */}
                  <input type="radio" name="role" value={r} required={i === 0} onChange={() => setTimeout(() => goTo(1), 180)} />
                  <Icon name={ROLE_ICONS[r]} size={18} /> {r}
                </label>
              ))}
            </div>
          </div>
          {partners && (
            <a href="#parceiros" className="reg__company">
              <Icon name="briefcase" size={20} />
              <span>
                <b>Sou empresa ou fornecedor</b>
                <small>Empresas participam como parceiras do evento. Veja como.</small>
              </span>
              <Icon name="arrowRight" size={18} />
            </a>
          )}
        </div>
      </fieldset>

      <fieldset {...fs(1)}>
        <div className="quote__body">
          <label className="field">
            <span>Nome completo *</span>
            <input name="name" className="input" required autoComplete="name" maxLength={120} />
          </label>
          <label className="field">
            <span>E-mail *</span>
            <input name="email" type="email" className="input" required autoComplete="email" maxLength={160} />
          </label>
          <label className="field">
            <span>WhatsApp *</span>
            <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" />
          </label>
        </div>
      </fieldset>

      <fieldset {...fs(2)}>
        <div className="quote__body">
          <label className="field">
            <span>Nome do condomínio *</span>
            <input name="condo" className="input" required minLength={2} maxLength={160} placeholder="Condomínio Edifício…" />
          </label>
          <div className="quote__row">
            <label className="field">
              <span>Nº de unidades</span>
              <input name="units" className="input" inputMode="numeric" maxLength={10} />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input name="city" className="input" maxLength={80} />
            </label>
          </div>
        </div>
      </fieldset>

      <Err state={state} />
      <div className="quote__nav">
        {step > 0 && (
          <button key="back" type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>
            Voltar
          </button>
        )}
        {step < REG_STEPS.length - 1 ? (
          <button key="next" type="button" className="btn btn--yellow btn--arrow" onClick={next}>
            Continuar
            <span className="btn__dot">
              <Icon name="arrowRight" size={16} />
            </span>
          </button>
        ) : (
          <button key="submit" type="submit" className="btn btn--yellow btn--arrow" disabled={pending}>
            {pending ? "Enviando…" : "Confirmar inscrição"}
            <span className="btn__dot">
              <Icon name="check" size={15} />
            </span>
          </button>
        )}
      </div>
      <div className="quote__trust">
        <span>
          <Icon name="check" size={14} /> Confirmação na hora
        </span>
        <span>
          <Icon name="shield" size={14} /> O e-mail dá acesso ao certificado
        </span>
      </div>
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
