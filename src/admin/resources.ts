import type { IconName } from "@/components/Icon";

/**
 * Cadastros do painel. Cada recurso descreve seus campos em português;
 * listagem, formulário e gravação são gerados a partir daqui.
 * Para criar um novo cadastro: adicione o model no schema.prisma e um item abaixo.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "image"
  | "url"
  | "date"
  | "datetime"
  | "number"
  | "bool"
  | "select"
  | "relation"
  | "relationMany"
  | "slug"
  | "icon";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  relation?: { model: ModelName; label: string };
  /** vai para a coluna lateral do formulário */
  side?: boolean;
  half?: boolean;
  defaultValue?: string | boolean | number;
};

export type ModelName =
  | "supplier"
  | "category"
  | "campaign"
  | "article"
  | "articleSection"
  | "course"
  | "event"
  | "partner";

export type ListColumn = { field: string; label: string; kind?: "date" | "bool" | "badge" | "relation" | "relationMany" };

export type ResourceDef = {
  key: string;
  model: ModelName;
  singular: string;
  plural: string;
  /** artigo para mensagens: "o"/"a" */
  gender: "o" | "a";
  icon: IconName;
  description: string;
  titleField: string;
  slugFrom?: string;
  imageField?: string;
  columns: ListColumn[];
  orderBy: Record<string, "asc" | "desc">[];
  include?: Record<string, unknown>;
  publicPath?: (item: Record<string, unknown>) => string | null;
  fields: FieldDef[];
};

const published: FieldDef = {
  name: "published",
  label: "Publicado no site",
  type: "bool",
  side: true,
  defaultValue: true,
  hint: "Desmarque para esconder sem apagar.",
};

const order: FieldDef = {
  name: "order",
  label: "Ordem de exibição",
  type: "number",
  side: true,
  defaultValue: 0,
  hint: "Menor aparece primeiro.",
};

const slug: FieldDef = {
  name: "slug",
  label: "Endereço da página",
  type: "slug",
  side: true,
  hint: "Gerado automaticamente a partir do nome.",
};

export const RESOURCES: ResourceDef[] = [
  {
    key: "fornecedores",
    model: "supplier",
    singular: "fornecedor",
    plural: "Fornecedores",
    gender: "o",
    icon: "building",
    description: "Empresas e síndicos profissionais que aparecem no guia de fornecedores.",
    titleField: "name",
    slugFrom: "name",
    imageField: "logo",
    orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    include: { categories: { select: { name: true } } },
    columns: [
      { field: "categories", label: "Categorias", kind: "relationMany" },
      { field: "city", label: "Cidade" },
      { field: "plan", label: "Plano", kind: "badge" },
      { field: "featured", label: "Destaque", kind: "bool" },
    ],
    publicPath: (i) => `/fornecedores/${i.slug}`,
    fields: [
      { name: "name", label: "Nome da empresa", type: "text", required: true },
      { name: "tagline", label: "Frase curta", type: "text", placeholder: "Ex.: Portaria e segurança 24h para condomínios" },
      { name: "categories", label: "Categorias", type: "relationMany", relation: { model: "category", label: "name" } },
      { name: "description", label: "Quem somos", type: "textarea", hint: "Texto de apresentação da empresa." },
      {
        name: "services",
        label: "Serviços oferecidos",
        type: "textarea",
        hint: "Separe por vírgula. Ex.: Limpeza, Jardinagem, Portaria",
      },
      { name: "city", label: "Cidade", type: "text", half: true },
      { name: "state", label: "Estado (UF)", type: "text", half: true, placeholder: "SP" },
      { name: "whatsapp", label: "WhatsApp", type: "text", half: true, placeholder: "(11) 90000-0000" },
      { name: "phone", label: "Telefone", type: "text", half: true },
      { name: "email", label: "E-mail", type: "text", half: true, hint: "Recebe os pedidos de orçamento." },
      { name: "website", label: "Site", type: "url", half: true },
      { name: "instagram", label: "Instagram (link)", type: "url" },
      { name: "logo", label: "Logo", type: "image", side: true },
      { name: "cover", label: "Foto de capa", type: "image", side: true },
      {
        name: "plan",
        label: "Plano",
        type: "select",
        side: true,
        defaultValue: "basico",
        options: [
          { value: "basico", label: "Básico" },
          { value: "verificado", label: "Verificado" },
          { value: "premium", label: "Premium" },
        ],
      },
      { name: "featured", label: "Destaque na página inicial", type: "bool", side: true },
      published,
      order,
      slug,
    ],
  },
  {
    key: "anuncios",
    model: "campaign",
    singular: "anúncio",
    plural: "Anúncios",
    gender: "o",
    icon: "megaphone",
    description: "Banners de empresas anunciantes. Saem do ar sozinhos na data final.",
    titleField: "title",
    imageField: "image",
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { supplier: { select: { name: true } } },
    columns: [
      { field: "placement", label: "Onde aparece", kind: "badge" },
      { field: "supplier", label: "Empresa", kind: "relation" },
      { field: "endsAt", label: "Termina em", kind: "date" },
    ],
    fields: [
      { name: "title", label: "Nome do anúncio", type: "text", required: true, hint: "Uso interno e texto alternativo da imagem." },
      { name: "image", label: "Imagem do banner", type: "image", required: true, hint: "Horizontal, ideal 1600×500 px." },
      { name: "link", label: "Link ao clicar", type: "url", placeholder: "https://" },
      { name: "supplierId", label: "Empresa anunciante", type: "relation", relation: { model: "supplier", label: "name" } },
      {
        name: "placement",
        label: "Onde aparece",
        type: "select",
        defaultValue: "home",
        options: [
          { value: "home", label: "Página inicial (carrossel)" },
          { value: "faixa", label: "Faixa entre seções" },
          { value: "materia", label: "Dentro das matérias" },
          { value: "fornecedores", label: "Guia de fornecedores" },
        ],
      },
      { name: "startsAt", label: "Começa em", type: "date", half: true },
      { name: "endsAt", label: "Termina em", type: "date", half: true, hint: "Vazio = sem data final." },
      published,
      order,
    ],
  },
  {
    key: "materias",
    model: "article",
    singular: "matéria",
    plural: "Matérias",
    gender: "a",
    icon: "newspaper",
    description: "Notícias e artigos do Informe-se.",
    titleField: "title",
    slugFrom: "title",
    imageField: "cover",
    orderBy: [{ publishedAt: "desc" }],
    include: { section: { select: { name: true } } },
    columns: [
      { field: "section", label: "Seção", kind: "relation" },
      { field: "author", label: "Colunista" },
      { field: "publishedAt", label: "Data", kind: "date" },
      { field: "featured", label: "Destaque", kind: "bool" },
    ],
    publicPath: (i) => `/informe-se/${i.slug}`,
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "excerpt", label: "Resumo", type: "textarea", hint: "Duas ou três linhas que aparecem na lista." },
      { name: "content", label: "Texto da matéria", type: "markdown" },
      { name: "author", label: "Colunista / autor", type: "text", half: true },
      { name: "authorBio", label: "Sobre o autor", type: "text", half: true },
      { name: "cover", label: "Imagem de capa", type: "image", side: true },
      { name: "sectionId", label: "Seção", type: "relation", relation: { model: "articleSection", label: "name" }, side: true },
      { name: "publishedAt", label: "Data de publicação", type: "datetime", side: true },
      { name: "featured", label: "Destaque na página inicial", type: "bool", side: true },
      published,
      slug,
    ],
  },
  {
    key: "cursos",
    model: "course",
    singular: "curso",
    plural: "Cursos",
    gender: "o",
    icon: "book",
    description: "Cursos e capacitações para síndicos.",
    titleField: "title",
    slugFrom: "title",
    imageField: "cover",
    orderBy: [{ startsAt: "desc" }],
    columns: [
      { field: "mode", label: "Formato", kind: "badge" },
      { field: "startsAt", label: "Início", kind: "date" },
      { field: "price", label: "Valor" },
    ],
    publicPath: (i) => `/cursos/${i.slug}`,
    fields: [
      { name: "title", label: "Nome do curso", type: "text", required: true },
      { name: "excerpt", label: "Resumo", type: "textarea" },
      { name: "description", label: "Descrição completa", type: "markdown" },
      { name: "instructor", label: "Professor(a)", type: "text", half: true },
      { name: "workload", label: "Carga horária", type: "text", half: true, placeholder: "Ex.: 8 horas" },
      { name: "price", label: "Valor", type: "text", half: true, placeholder: "Ex.: Gratuito ou R$ 197" },
      { name: "link", label: "Link de inscrição", type: "url", half: true },
      { name: "cover", label: "Imagem", type: "image", side: true },
      {
        name: "mode",
        label: "Formato",
        type: "select",
        side: true,
        defaultValue: "online",
        options: [
          { value: "online", label: "Online" },
          { value: "presencial", label: "Presencial" },
          { value: "hibrido", label: "Híbrido" },
        ],
      },
      { name: "startsAt", label: "Data de início", type: "datetime", side: true },
      published,
      slug,
    ],
  },
  {
    key: "eventos",
    model: "event",
    singular: "evento",
    plural: "Eventos",
    gender: "o",
    icon: "calendar",
    description: "Encontros de síndicos, palestras e feiras.",
    titleField: "title",
    slugFrom: "title",
    imageField: "cover",
    orderBy: [{ startsAt: "desc" }],
    columns: [
      { field: "startsAt", label: "Data", kind: "date" },
      { field: "city", label: "Cidade" },
      { field: "venue", label: "Local" },
    ],
    publicPath: (i) => `/eventos/${i.slug}`,
    fields: [
      { name: "title", label: "Nome do evento", type: "text", required: true },
      { name: "excerpt", label: "Chamada", type: "textarea" },
      { name: "description", label: "Programação / detalhes", type: "markdown" },
      { name: "venue", label: "Local", type: "text", half: true, placeholder: "Ex.: Hotel Slaviero" },
      { name: "city", label: "Cidade", type: "text", half: true },
      { name: "link", label: "Link de inscrição", type: "url" },
      { name: "cover", label: "Imagem", type: "image", side: true },
      { name: "startsAt", label: "Data e hora", type: "datetime", side: true },
      published,
      slug,
    ],
  },
  {
    key: "parceiros",
    model: "partner",
    singular: "parceiro",
    plural: "Parceiros",
    gender: "o",
    icon: "handshake",
    description: "Parceiros, patrocinadores e apoiadores exibidos no site.",
    titleField: "name",
    imageField: "logo",
    orderBy: [{ order: "asc" }, { name: "asc" }],
    columns: [{ field: "kind", label: "Tipo", kind: "badge" }],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "logo", label: "Logo", type: "image", hint: "PNG com fundo transparente fica melhor." },
      { name: "url", label: "Site", type: "url" },
      { name: "description", label: "Descrição curta", type: "textarea" },
      {
        name: "kind",
        label: "Tipo",
        type: "select",
        side: true,
        defaultValue: "parceiro",
        options: [
          { value: "parceiro", label: "Parceiro" },
          { value: "patrocinador", label: "Patrocinador" },
          { value: "apoio", label: "Apoio" },
        ],
      },
      published,
      order,
    ],
  },
  {
    key: "categorias",
    model: "category",
    singular: "categoria",
    plural: "Categorias",
    gender: "a",
    icon: "grid",
    description: "Especialidades usadas para filtrar fornecedores.",
    titleField: "name",
    slugFrom: "name",
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { suppliers: true } } },
    columns: [{ field: "_count.suppliers", label: "Fornecedores" }],
    publicPath: (i) => `/fornecedores?categoria=${i.slug}`,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "description", label: "Descrição curta", type: "textarea" },
      { name: "icon", label: "Ícone", type: "icon", side: true },
      published,
      order,
      slug,
    ],
  },
  {
    key: "secoes",
    model: "articleSection",
    singular: "seção",
    plural: "Seções de matérias",
    gender: "a",
    icon: "layers",
    description: "Jurídico, Manutenção, Finanças… usadas no Informe-se.",
    titleField: "name",
    slugFrom: "name",
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
    columns: [{ field: "_count.articles", label: "Matérias" }],
    publicPath: (i) => `/informe-se?secao=${i.slug}`,
    fields: [{ name: "name", label: "Nome", type: "text", required: true }, order, slug],
  },
];

export function getResource(key: string) {
  return RESOURCES.find((r) => r.key === key) ?? null;
}

export const OPTION_LABELS: Record<string, string> = Object.fromEntries(
  RESOURCES.flatMap((r) => r.fields.flatMap((f) => (f.options ?? []).map((o) => [`${f.name}:${o.value}`, o.label]))),
);
