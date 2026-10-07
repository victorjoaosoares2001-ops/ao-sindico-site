"use client";

import { marked } from "marked";
import { useRef, useState } from "react";
import { Icon, ICON_NAMES } from "@/components/Icon";

/** Campo de imagem: clique ou arraste; mostra prévia; permite remover ou colar link. */
export function ImageField({ name, value, label, hint, required }: { name: string; value?: string | null; label: string; hint?: string; required?: boolean }) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [remove, setRemove] = useState(false);
  const [drag, setDrag] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f?: File | null) => {
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setRemove(false);
  };

  return (
    <div className="img-field">
      <span className="label">
        {label} {required && <span className="req">*</span>}
      </span>
      <label
        className="img-drop"
        data-drag={drag}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={() => setDrag(false)}
      >
        {preview && !remove ? (
          <img src={preview} alt="" />
        ) : (
          <span className="img-drop__empty">
            <Icon name="upload" size={24} />
            <strong>Clique ou arraste uma imagem</strong>
            JPG, PNG ou WEBP até 6 MB
          </span>
        )}
        <input ref={fileRef} type="file" name={`${name}__file`} accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <input type={showUrl ? "url" : "hidden"} name={name} defaultValue={value ?? ""} className="input" placeholder="https://… (link da imagem)" onChange={(e) => setPreview(e.target.value || null)} />
      <input type="hidden" name={`${name}__remove`} value={remove ? "on" : ""} />
      <div className="img-tools">
        {preview && !remove && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setRemove(true);
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            <Icon name="trash" size={15} /> Remover
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowUrl((v) => !v)}>
          <Icon name="link" size={15} /> {showUrl ? "Esconder link" : "Usar link"}
        </button>
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Editor de texto com botões simples (gera Markdown por baixo). */
export function MarkdownField({ name, value, label, hint }: { name: string; value?: string | null; label: string; hint?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(value ?? "");
  const [preview, setPreview] = useState(false);

  const wrap = (before: string, after = before, placeholder = "texto") => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = text.slice(s, e) || placeholder;
    const next = text.slice(0, s) + before + sel + after + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };

  const linePrefix = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = text.lastIndexOf("\n", s - 1) + 1;
    setText(text.slice(0, lineStart) + prefix + text.slice(lineStart));
    requestAnimationFrame(() => ta.focus());
  };

  const addLink = () => {
    const url = window.prompt("Cole o endereço do link (https://…)");
    if (url) wrap("[", `](${url})`, "texto do link");
  };

  return (
    <div className="field">
      <span>{label}</span>
      <div className="md-editor">
        <div className="md-toolbar" role="toolbar" aria-label="Formatação">
          <button type="button" onClick={() => linePrefix("## ")} title="Subtítulo">
            <Icon name="heading" size={15} /> Subtítulo
          </button>
          <button type="button" onClick={() => wrap("**")} title="Negrito">
            <Icon name="bold" size={15} /> Negrito
          </button>
          <button type="button" onClick={() => linePrefix("- ")} title="Lista">
            <Icon name="list" size={15} /> Lista
          </button>
          <button type="button" onClick={() => linePrefix("> ")} title="Citação">
            <Icon name="quote" size={15} /> Destaque
          </button>
          <button type="button" onClick={addLink} title="Link">
            <Icon name="link" size={15} /> Link
          </button>
          <span className="sep" />
          <button type="button" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
            <Icon name={preview ? "edit" : "eye"} size={15} /> {preview ? "Editar" : "Ver como fica"}
          </button>
        </div>
        {preview ? (
          <div className="md-preview prose" dangerouslySetInnerHTML={{ __html: marked.parse(text.replace(/</g, "&lt;"), { async: false, breaks: true }) as string }} />
        ) : (
          <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva o texto aqui. Deixe uma linha em branco entre parágrafos." />
        )}
      </div>
      <input type="hidden" name={name} value={text} />
      <span className="hint">{hint ?? "Dica: selecione um trecho e clique em Negrito. Linha em branco separa parágrafos."}</span>
    </div>
  );
}

export function IconField({ name, value, label }: { name: string; value?: string | null; label: string }) {
  const options = ["building", "shield", "wrench", "sparkles", "leaf", "zap", "droplet", "camera", "users", "briefcase", "paint", "scale", "home", "key", "layers", "grid", "megaphone", "book", "handshake", "globe", "phone", "tag"];
  return (
    <div className="field">
      <span>{label}</span>
      <div className="icon-pick">
        {options.filter((o) => ICON_NAMES.includes(o as never)).map((o) => (
          <label key={o} title={o}>
            <input type="radio" name={name} value={o} defaultChecked={(value || "sparkles") === o} />
            <Icon name={o} size={20} />
          </label>
        ))}
      </div>
    </div>
  );
}

export function Switch({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="switch">
      <span className="switch__text">
        <strong>{label}</strong>
        {hint && <span className="hint">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className="switch__ui" aria-hidden="true" />
    </label>
  );
}
