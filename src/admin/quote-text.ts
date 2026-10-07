import type { Message } from "@prisma/client";

/** Texto padrão de encaminhamento do pedido para uma empresa (WhatsApp, e-mail manual e e-mail do sistema). */
export function buildQuoteText(m: Message, supplierName: string) {
  const where = [m.neighborhood, m.city, m.state].filter(Boolean).join(" · ");
  return [
    `Olá, ${supplierName}! Aqui é da equipe Ao Síndico.`,
    `Recebemos um pedido de orçamento que combina com a sua empresa:`,
    ``,
    m.category && `*Serviço:* ${m.category}`,
    m.body && `*Descrição:* ${m.body}`,
    m.company && `*Condomínio:* ${m.company}${m.units ? ` (${m.units} unidades)` : ""}${m.condoType ? ` · ${m.condoType}` : ""}`,
    where && `*Local:* ${where}`,
    m.urgency && `*Prazo:* ${m.urgency}`,
    m.budget && `*Orçamento previsto:* ${m.budget}`,
    ``,
    `*Contato:* ${m.name}${m.contactRole ? ` (${m.contactRole})` : ""}${m.phone ? ` · ${m.phone}` : ""}${m.email ? ` · ${m.email}` : ""}`,
    m.preferredTime && `*Melhor horário:* ${m.preferredTime}`,
    ``,
    `Por favor, entre em contato diretamente. Obrigado!`,
  ]
    .filter((l): l is string => typeof l === "string")
    .join("\n");
}
