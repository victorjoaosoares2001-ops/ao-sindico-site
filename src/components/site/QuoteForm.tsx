"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { submitQuote, type PublicFormState } from "@/lib/public-actions";

type Props = {
  categories: { name: string; icon?: string | null }[];
  suppliers?: { id: string; name: string }[];
  preselected?: string[];
  initial?: { category?: string; body?: string; city?: string };
  tone?: "dark" | "light";
  source?: string;
  title?: string;
  compact?: boolean;
};

const STEPS = ["Necessidade", "Condomínio", "Detalhes", "Contato", "Revisão"];

const LABELS: Record<string, string> = {
  category: "Serviço",
  company: "Condomínio",
  condoType: "Tipo",
  units: "Unidades",
  city: "Cidade",
  state: "UF",
  neighborhood: "Bairro",
  body: "O que precisa",
  urgency: "Prazo",
  budget: "Orçamento previsto",
  name: "Nome",
  contactRole: "Você é",
  email: "E-mail",
  phone: "WhatsApp",
  preferredTime: "Melhor horário",
};

const REVIEW_ORDER: [number, string[]][] = [
  [0, ["category"]],
  [1, ["company", "condoType", "units", "neighborhood", "city", "state"]],
  [2, ["body", "urgency", "budget"]],
  [3, ["name", "contactRole", "email", "phone", "preferredTime"]],
];

/**
 * Pedido de orçamento em 5 etapas. Fica salvo em “Orçamentos e mensagens” no painel,
 * onde a equipe encaminha às empresas e acompanha.
 */
export function QuoteForm({ categories, suppliers = [], preselected = [], initial = {}, tone = "dark", source, title = "Solicitar orçamento", compact }: Props) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitQuote, {});
  const [step, setStep] = useState(0);
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const refs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const [t0, setT0] = useState(0); // horário em que o formulário apareceu (barra robôs)
  useEffect(() => setT0(Date.now()), []);

  const collect = () => {
    const fd = new FormData(formRef.current!);
    const out: Record<string, string> = {};
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v && LABELS[k]) out[k] = v;
    return out;
  };

  const goTo = (n: number) => {
    setStep(n);
    if (n === 4) setSnapshot(collect());
    // em telas pequenas, volta o topo do formulário para a vista
    requestAnimationFrame(() => {
      const top = formRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0 || top > window.innerHeight * 0.6) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const next = () => {
    const fs = refs.current[step];
    const invalid = fs?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(":invalid");
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  };

  if (state.ok) {
    return (
      <div className={`quote quote--${tone}`}>
        <div className="quote__done" role="status">
          <span className="quote__done-icon">
            <Icon name="check" size={26} />
          </span>
          <h2 style={{ fontSize: 24 }}>Pedido enviado!</h2>
          <p style={{ opacity: 0.8 }}>{state.message}</p>
          {state.protocol && (
            <span className="protocol">
              Protocolo <b>#{state.protocol}</b>
            </span>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/fornecedores" className={`btn ${tone === "dark" ? "btn--glass" : "btn--ghost"}`}>
              Ver fornecedores
            </Link>
            <Link href="/tira-duvidas" className={`btn ${tone === "dark" ? "btn--glass" : "btn--ghost"}`}>
              Tira-Dúvidas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fs = (i: number) => ({
    ref: (el: HTMLFieldSetElement | null) => {
      refs.current[i] = el;
    },
    hidden: step !== i,
    style: { border: 0, padding: 0, margin: 0, minWidth: 0 },
  });

  return (
    <form ref={formRef} action={action} className={`quote wizard quote--${tone}`} style={{ scrollMarginTop: 110 }}>
      <div className="quote__head">
        <div>
          <h2>{title}</h2>
          {!compact && <p>Grátis. Nossa equipe encaminha às empresas certas.</p>}
        </div>
      </div>
      <ol className="wizard__progress" aria-label={`Etapa ${step + 1} de ${STEPS.length}: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <li key={s} data-state={i < step ? "done" : i === step ? "current" : "todo"} aria-current={i === step ? "step" : undefined}>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <input type="text" name="empresa_site" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="hidden" name="t0" value={t0 || ""} />
      <input type="hidden" name="source" value={source ?? ""} />

      {/* 1. Necessidade */}
      <fieldset {...fs(0)}>
        <div className="quote__body">
          <div className="field">
            <span>Qual serviço o condomínio precisa?</span>
            <div className="choice-grid" role="radiogroup" aria-label="Tipo de serviço">
              {[...categories, { name: "Outro", icon: "sparkles" }].map((c, i) => (
                <label key={c.name} className="choice">
                  <input type="radio" name="category" value={c.name} required={i === 0} defaultChecked={initial.category === c.name} />
                  <Icon name={c.icon || "sparkles"} size={18} /> {c.name}
                </label>
              ))}
            </div>
          </div>
          {suppliers.length > 0 && (
            <div className="field">
              <span>Enviar também para estas empresas</span>
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

      {/* 2. Condomínio e localização */}
      <fieldset {...fs(1)}>
        <div className="quote__body">
          <label className="field">
            <span>Nome do condomínio</span>
            <input name="company" className="input" placeholder="Condomínio Edifício…" maxLength={160} />
          </label>
          <div className="quote__row">
            <label className="field">
              <span>Tipo</span>
              <select name="condoType" className="select" defaultValue="Residencial">
                <option>Residencial</option>
                <option>Comercial</option>
                <option>Misto</option>
                <option>Associação / loteamento</option>
              </select>
            </label>
            <label className="field">
              <span>Nº de unidades</span>
              <input name="units" className="input" inputMode="numeric" placeholder="Ex.: 120" maxLength={10} />
            </label>
          </div>
          <div className="quote__row">
            <label className="field">
              <span>Cidade *</span>
              <input name="city" className="input" required defaultValue={initial.city} autoComplete="address-level2" maxLength={80} />
            </label>
            <label className="field">
              <span>Bairro</span>
              <input name="neighborhood" className="input" maxLength={80} />
            </label>
          </div>
          <label className="field" style={{ maxWidth: 140 }}>
            <span>Estado</span>
            <input name="state" className="input" defaultValue="SP" maxLength={2} autoComplete="address-level1" style={{ textTransform: "uppercase" }} />
          </label>
        </div>
      </fieldset>

      {/* 3. Detalhes e urgência */}
      <fieldset {...fs(2)}>
        <div className="quote__body">
          <label className="field">
            <span>Descreva o que precisa *</span>
            <textarea name="body" className="textarea" rows={4} placeholder="Ex.: pintura da fachada de 2 torres de 12 andares, com lavagem e tratamento de trincas." defaultValue={initial.body} required minLength={10} maxLength={4000} />
          </label>
          <div className="field">
            <span>Prazo</span>
            <div className="choice-grid">
              {["Urgente", "Nos próximos 30 dias", "Em até 3 meses", "Só pesquisando preços"].map((u, i) => (
                <label key={u} className="choice">
                  <input type="radio" name="urgency" value={u} defaultChecked={i === 1} /> {u}
                </label>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Orçamento previsto (opcional)</span>
            <select name="budget" className="select" defaultValue="">
              <option value="">Prefiro não informar</option>
              <option>Até R$ 5 mil</option>
              <option>R$ 5 mil a R$ 20 mil</option>
              <option>R$ 20 mil a R$ 100 mil</option>
              <option>Acima de R$ 100 mil</option>
            </select>
          </label>
        </div>
      </fieldset>

      {/* 4. Contato */}
      <fieldset {...fs(3)}>
        <div className="quote__body">
          <div className="quote__row">
            <label className="field">
              <span>Seu nome *</span>
              <input name="name" className="input" autoComplete="name" required minLength={2} maxLength={120} />
            </label>
            <label className="field">
              <span>Você é</span>
              <select name="contactRole" className="select" defaultValue="Síndico(a)">
                <option>Síndico(a)</option>
                <option>Síndico(a) profissional</option>
                <option>Administradora</option>
                <option>Conselheiro(a)</option>
                <option>Zelador(a) / gerente predial</option>
                <option>Morador(a)</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>E-mail *</span>
            <input name="email" type="email" className="input" autoComplete="email" required maxLength={160} />
          </label>
          <div className="quote__row">
            <label className="field">
              <span>WhatsApp *</span>
              <input name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" placeholder="(11) 90000-0000" required pattern="[\d\s()+\-]{10,}" title="Inclua o DDD" />
            </label>
            <label className="field">
              <span>Melhor horário</span>
              <select name="preferredTime" className="select" defaultValue="Qualquer horário">
                <option>Qualquer horário</option>
                <option>Manhã</option>
                <option>Tarde</option>
                <option>Noite</option>
              </select>
            </label>
          </div>
        </div>
      </fieldset>

      {/* 5. Revisão */}
      <fieldset {...fs(4)}>
        <div className="quote__body">
          <p style={{ fontSize: 14, opacity: 0.8 }}>Confira antes de enviar:</p>
          <dl className="review-list">
            {REVIEW_ORDER.flatMap(([s, keys]) =>
              keys
                .filter((k) => snapshot[k])
                .map((k, i) => (
                  <div key={k}>
                    <dt>{LABELS[k]}</dt>
                    <dd>{k === "body" && snapshot[k].length > 160 ? `${snapshot[k].slice(0, 160)}…` : snapshot[k]}</dd>
                    {i === 0 ? (
                      <button type="button" onClick={() => goTo(s)}>
                        Editar
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                )),
            )}
          </dl>
          <p style={{ fontSize: 12.5, opacity: 0.7 }}>
            Ao enviar, você autoriza a Ao Síndico a compartilhar este pedido com as empresas selecionadas para que elas façam contato.
          </p>
        </div>
      </fieldset>

      {state.error && (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      )}

      <div className="quote__nav">
        {step > 0 && (
          <button key="back" type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>
            Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          // keys distintas: impede o React de reaproveitar o botão "Continuar" como "Enviar"
          <button key="next" type="button" className="btn btn--yellow btn--arrow" onClick={next}>
            {step === 3 ? "Revisar pedido" : "Continuar"}
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
          <Icon name="shield" size={14} /> Seus dados vão só para as empresas escolhidas
        </span>
        <span>
          <Icon name="check" size={14} /> 100% gratuito
        </span>
      </div>
    </form>
  );
}
