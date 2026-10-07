import "server-only";

/**
 * Envio de e-mails transacionais pela API do Resend (https://resend.com).
 * Configure na hospedagem: RESEND_API_KEY e EMAIL_FROM (ex.: "Ao Síndico <contato@aosindico.com>",
 * com o domínio verificado no Resend). Sem essas variáveis nada é enviado e o painel continua
 * funcionando com os botões de WhatsApp/e-mail manual.
 */

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Texto simples → HTML legível (parágrafos e negrito *assim*). */
function toHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55">${esc(p).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export type SendResult = { sent: boolean; error?: string };

export async function sendEmail(opts: { to: string | string[]; subject: string; text: string; replyTo?: string | null }): Promise<SendResult> {
  if (!emailConfigured()) return { sent: false, error: "E-mail não configurado" };
  const to = (Array.isArray(opts.to) ? opts.to : opts.to.split(/[,;]/)).map((s) => s.trim()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  if (!to.length) return { sent: false, error: "Destinatário inválido" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject: opts.subject,
        text: opts.text.replace(/\*/g, ""),
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1c1d21;max-width:620px">${toHtml(opts.text)}<p style="color:#7a7d86;font-size:12px;margin-top:24px">Portal Ao Síndico</p></div>`,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { sent: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "falha no envio" };
  }
}

/** Nunca derruba o fluxo principal por causa de e-mail. */
export async function sendQuietly(opts: Parameters<typeof sendEmail>[0]) {
  const r = await sendEmail(opts);
  if (!r.sent && emailConfigured()) console.error("[email]", r.error, opts.subject);
  return r;
}
