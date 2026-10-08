/**
 * Marca oficial "Ao Síndico": ícone em chevrons (azul-petróleo, magenta,
 * amarelo) extraído do logo oficial ao lado da palavra. Funciona em fundo
 * claro e escuro (o ícone tem fundo transparente).
 */
export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  return (
    <span className={`logo logo--${tone}`} aria-label="Portal Ao Síndico">
      <img className="logo__icon" src="/logo-icon.png" alt="" width={27} height={38} />
      {!compact && <span className="logo__portal">Portal</span>}
      <span className="logo__main">
        <strong>AoSíndico</strong>
        <span className="logo__com">.com</span>
      </span>
    </span>
  );
}
