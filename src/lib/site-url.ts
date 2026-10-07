/**
 * URL pública do portal, sem domínio fixo no código:
 * 1. SITE_URL (defina com o domínio final, ex.: https://aosindico.com)
 * 2. domínio de produção que a Vercel informa no build/execução
 * 3. localhost em desenvolvimento
 */
export function siteUrl() {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/$/, "");
  const isLocal = !!fromEnv && /localhost|127\.0\.0\.1/.test(fromEnv);
  // um SITE_URL de localhost esquecido nunca vale em produção
  if (fromEnv && !(isLocal && process.env.VERCEL)) return fromEnv;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Em produção só indexa o domínio oficial (não as URLs de pré-visualização da Vercel). */
export function isIndexable() {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  return true;
}
