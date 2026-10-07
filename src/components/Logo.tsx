/**
 * Marca oficial "Portal AoSindico.com": três quadrados (azul-petróleo,
 * magenta, amarelo) sobre a palavra. Redesenhada em vetor para ficar nítida
 * em fundo claro e escuro.
 */
export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  return (
    <span className={`logo logo--${tone}`} aria-label="Portal Ao Síndico">
      {!compact && <span className="logo__portal">Portal</span>}
      <span className="logo__main">
        <span className="logo__marks" aria-hidden="true">
          <i style={{ background: "var(--teal-deep)" }} />
          <i style={{ background: "var(--magenta)" }} />
          <i style={{ background: "var(--yellow)" }} />
        </span>
        <strong>AoSindico</strong>
        <span className="logo__com">.com</span>
      </span>
    </span>
  );
}
