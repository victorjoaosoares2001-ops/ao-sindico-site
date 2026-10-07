export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const tz = "America/Sao_Paulo";

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" }) {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, ...opts }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined) {
  return formatDate(d, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function dayMonth(d: Date | string) {
  const date = new Date(d);
  return {
    day: formatDate(date, { day: "2-digit" }),
    month: formatDate(date, { month: "short" }).replace(".", ""),
  };
}

export function onlyDigits(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

/** Link wa.me com DDI 55 quando o número vier sem ele. */
export function whatsappLink(phone: string | null | undefined, text?: string) {
  let n = onlyDigits(phone);
  if (!n) return null;
  if (n.length <= 11) n = "55" + n;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function splitList(s: string | null | undefined) {
  return (s ?? "")
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function readingTime(text: string | null | undefined) {
  const words = (text ?? "").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
