export const TYPE_LABEL: Record<string, string> = {
  orcamento: "Orçamento",
  anunciar: "Quer anunciar",
  contato: "Contato",
};

export const STATUS_LABEL: Record<string, string> = {
  novo: "Responder",
  andamento: "Em andamento",
  respondido: "Respondido",
  arquivado: "Arquivado",
};

export const STATUS_OPTIONS = ["novo", "andamento", "respondido", "arquivado"] as const;
