"use client";

import { useFormStatus } from "react-dom";
import { Icon, type IconName } from "@/components/Icon";

/** Botão de formulário que pede confirmação antes de enviar (excluir etc.). */
export function ConfirmButton({
  message,
  children,
  className = "btn btn--ghost btn--sm",
  icon,
  title,
}: {
  message: string;
  children?: React.ReactNode;
  className?: string;
  icon?: IconName;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      title={title}
      aria-label={title}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  );
}

export function SubmitButton({ children, className = "btn", pendingText = "Salvando…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={async (e) => {
        const btn = e.currentTarget;
        await navigator.clipboard.writeText(text);
        const old = btn.innerText;
        btn.innerText = "Copiado!";
        setTimeout(() => (btn.innerText = old), 1500);
      }}
    >
      <Icon name="copy" size={15} /> {label}
    </button>
  );
}
