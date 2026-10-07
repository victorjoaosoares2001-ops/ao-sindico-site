/** Posições de anúncio no portal, com o tamanho de imagem recomendado. */
export const PLACEMENTS = [
  { value: "home", label: "Página inicial · carrossel de destaque", size: "1600 × 500 px (horizontal)", max: 8 },
  { value: "faixa", label: "Página inicial · faixa entre seções", size: "1600 × 300 px (faixa larga)", max: 1 },
  { value: "fornecedores", label: "Guia de fornecedores · topo da lista", size: "1600 × 300 px (faixa larga)", max: 1 },
  { value: "materia", label: "Matérias · coluna lateral", size: "600 × 600 px (quadrado)", max: 3 },
  { value: "lateral", label: "Busca, Tira-Dúvidas e agenda · lateral", size: "600 × 600 px (quadrado)", max: 2 },
] as const;

export type Placement = (typeof PLACEMENTS)[number]["value"];

export const placementLabel = (v: string) => PLACEMENTS.find((p) => p.value === v)?.label ?? v;
