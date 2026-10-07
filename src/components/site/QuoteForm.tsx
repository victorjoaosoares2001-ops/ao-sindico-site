"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { submitQuote, type PublicFormState } from "@/lib/public-actions";

type Props = {
  categories: string[];
  suppliers?: { id: string; name: string }[];
  preselected?: string[];
  initial?: { category?: string; body?: string; city?: string };
  tone?: "dark" | "light";
  source?: string;
  title?: string;
};

const STEPS = ["Serviço", "Condomínio", "Contato"];

/**
 * Pedido de orçamento em 3 passos. O pedido cai em “Mensagens” no painel,
 * onde a equipe encaminha às empresas.
 */
export function QuoteForm({ categories, suppliers = [], preselected = [], initial = {}, tone = "dark", source, title = "Solicitar cotação" }: Props) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitQuote, {});
  const [step, setStep] = useState(0);
  const refs = useRef<(HTMLFieldSetElement | null)[]>([]);

  const next = () => {
    const fs = refs.current[step];
    const invalid = fs?.querySelector<HTMLInputElement>(":invalid");
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  if (state.ok) {
    return (
      <div className={`quote quote--${tone}`}>
        <div className="quote__done" role="status">
          <span className="quote__done-icon">
            <Icon name="check" size={26} />
          </span>
          <h2 style={{ fontSize: 24 }}>Pedido recebido!</h2>
          <p style={{ opacity: 0.8 }}>{state.message}</p>
          <Link href="/fornecedores" className={`btn ${tone === "dark" ? "btn--glass" : "btn--ghost"}`}>
            Ver fornecedores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className={`quote quote--${tone}`} noValidate={false}>
      <div className="quote__head">
        <div>
          <h2>{title}</h2>
          <p>Receba orçamentos das melhores empresas. Grátis.</p>
        </div>
        <div className="quote__steps" aria-label={`Passo ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <i key={s} data-on={i <= step} />
          ))}
        </div>
      </div>

      <input type="text" name="empresa_site" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="hidden" name="source" value={source ?? ""} />

      <fieldset ref={(el) => { refs.current[0] = el; }} hidden={step !== 0} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="quote__body">
          <label className="field">
            <span>Tipo de serviço</span>
            <select name="category" className="select" defaultValue={initial.category ?? ""} required>
              <option value="" disabled>
                Escolha uma categoria
              </option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option>Outro</option>
            </select>
          </label>
          <label className="field">
            <span>O que você precisa?</span>
            <textarea
              name="body"
              className="textarea"
              rows={3}
              style={{ minHeight: 92 }}
              placeholder="Ex.: pintura da fachada de 2 torres, 12 andares"
              defaultValue={initial.body}
              required
              minLength={3}
            />
          </label>
          <label className="field">
            <span>Cidade</span>
            <input name="city" className="input" placeholder="Em qual cidade?" defaultValue={initial.city} required />
          </label>
          {suppliers.length > 0 && (
            <div className="field">
              <span>Enviar para estas empresas</span>
              <div className="picked">
                {suppliers.map((s) => (
                  <label key={s.id}>
                    <input type="checkbox" name="suppliers" value={s.id} defaultChecked={preselected.includes(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset ref={(el) => { refs.current[1] = el; }} hidden={step !== 1} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="quote__body">
          <label className="field">
            <span>Nome do condomínio</span>
            <input name="company" className="input" placeholder="Condomínio Edifício…" />
          </label>
          <div className="quote__row">
            <label className="field">
              <span>Nº de unidades</span>
              <input name="units" className="input" inputMode="numeric" placeholder="Ex.: 120" />
            </label>
            <label className="field">
              <span>Prazo</span>
              <select name="urgency" className="select" defaultValue="Nos próximos 30 dias">
                <option>Urgente</option>
                <option>Nos próximos 30 dias</option>
                <option>Em até 3 meses</option>
                <option>Só pesquisando preços</option>
              </select>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset ref={(el) => { refs.current[2] = el; }} hidden={step !== 2} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="quote__body">
          <label className="field">
            <span>Seu nome</span>
            <input name="name" className="input" autoComplete="name" required minLength={2} />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" className="input" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Celular / WhatsApp</span>
            <input name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" placeholder="(11) 90000-0000" required />
          </label>
        </div>
      </fieldset>

      {state.error && (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      )}

      <div className="quote__nav">
        {step > 0 && (
          <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
            Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          // keys distintas: impede o React de reaproveitar o botão "Continuar" como "Enviar" (enviaria antes da hora)
          <button key="next" type="button" className="btn btn--yellow btn--arrow" onClick={next}>
            Continuar
            <span className="btn__dot">
              <Icon name="arrowRight" size={16} />
            </span>
          </button>
        ) : (
          <button key="submit" type="submit" className="btn btn--yellow btn--arrow" disabled={pending}>
            {pending ? "Enviando…" : "Enviar pedido"}
            <span className="btn__dot">
              <Icon name="send" size={15} />
            </span>
          </button>
        )}
      </div>

      <div className="quote__trust">
        <span>
          <Icon name="shield" size={14} /> Seus dados não são divulgados
        </span>
        <span>
          <Icon name="check" size={14} /> 100% gratuito
        </span>
      </div>
    </form>
  );
}
