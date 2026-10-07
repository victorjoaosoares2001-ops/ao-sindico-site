import type { IconName } from "@/components/Icon";
import type { Module } from "@/lib/permissions";
import { PLACEMENTS } from "@/lib/placements";

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
  | "icon"
  | "rating";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string; hint?: string }[];
  relation?: { model: ModelName; label: string; where?: Record<string, unknown> };
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
  | "author"
  | "question"
  | "video"
  | "review"
  | "course"
  | "event"
  | "partner";

export type ListColumn = { field: string; label: string; kind?: "date" | "bool" | "badge" | "relation" | "relationMany" | "stars" };

/** Filtros rápidos (abas) da listagem. */
export type ListTab = { key: string; label: string; where: Record<string, unknown> };

export type ResourceDef = {
  key: string;
  model: ModelName;
  module: Module;
  singular: string;
  plural: string;
  gender: "o" | "a";
  icon: IconName;
  description: string;
  titleField: string;
  slugFrom?: string;
  imageField?: string;
  /** campo booleano que controla se aparece no site */
  publishField?: string;
  columns: ListColumn[];
  tabs?: ListTab[];
  /** filtros aceitos pela URL (?campo=valor), ex.: anúncios de uma empresa */
  urlFilters?: string[];
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

const authorField: FieldDef = {
  name: "authorId",
  label: "Autor / colunista",
  type: "relation",
  relation: { model: "author", label: "name" },
  side: true,
  hint: "Cadastre novos em Autores.",
};

const publishedTabs: ListTab[] = [
  { key: "publicado", label: "No site", where: { published: true } },
  { key: "oculto", label: "Escondidos", where: { published: false } },
];

export const RESOURCES: ResourceDef[] = [
  // ---------------- Comercial ----------------
  {
    key: "fornecedores",
    model: "supplier",
    module: "comercial",
    singular: "fornecedor",
    plural: "Fornecedores",
    gender: "o",
    icon: "building",
    description: "Empresas e síndicos profissionais do guia. Na página de cada empresa você cria os anúncios dela.",
    titleField: "name",
    slugFrom: "name",
    imageField: "logo",
    publishField: "published",
    orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    include: { categories: { select: { name: true } }, _count: { select: { campaigns: true } } },
    tabs: [
      ...publishedTabs,
      { key: "premium", label: "Premium", where: { plan: "premium" } },
      { key: "destaque", label: "Destaque", where: { featured: true } },
    ],
    columns: [
      { field: "categories", label: "Categorias", kind: "relationMany" },
      { field: "city", label: "Cidade" },
      { field: "plan", label: "Plano", kind: "badge" },
      { field: "_count.campaigns", label: "Anúncios" },
    ],
    publicPath: (i) => `/fornecedores/${i.slug}`,
    fields: [
      { name: "name", label: "Nome da empresa", type: "text", required: true },
      { name: "tagline", label: "Frase curta", type: "text", placeholder: "Ex.: Portaria e segurança 24h para condomínios" },
      { name: "categories", label: "Categorias", type: "relationMany", relation: { model: "category", label: "name" } },
      { name: "description", label: "Quem somos", type: "textarea", hint: "Texto de apresentação da empresa." },
      { name: "services", label: "Serviços oferecidos", type: "textarea", hint: "Separe por vírgula. Ex.: Limpeza, Jardinagem, Portaria" },
      { name: "city", label: "Cidade", type: "text", half: true },
      { name: "state", label: "Estado (UF)", type: "text", half: true, placeholder: "SP" },
      { name: "address", label: "Endereço / região atendida", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text", half: true, placeholder: "(11) 90000-0000" },
      { name: "phone", label: "Telefone", type: "text", half: true },
      { name: "email", label: "E-mail", type: "text", half: true, hint: "Recebe os pedidos de orçamento." },
      { name: "website", label: "Site", type: "url", half: true },
      { name: "instagram", label: "Instagram (link)", type: "url", half: true },
      { name: "facebook", label: "Facebook (link)", type: "url", half: true },
      { name: "notes", label: "Observações internas (não aparecem no site)", type: "textarea", hint: "Contrato, contato do comercial, vencimento…" },
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
    module: "comercial",
    singular: "anúncio",
    plural: "Anúncios",
    gender: "o",
    icon: "megaphone",
    description: "Banners das empresas anunciantes. Entram e saem do ar sozinhos nas datas definidas.",
    titleField: "title",
    imageField: "image",
    publishField: "published",
    urlFilters: ["supplierId"],
    orderBy: [{ order: "desc" }, { createdAt: "desc" }],
    include: { supplier: { select: { name: true } } },
    tabs: [
      ...publishedTabs,
      ...PLACEMENTS.map((p) => ({ key: p.value, label: p.label.split(" · ")[1] ?? p.label, where: { placement: p.value } })),
    ],
    columns: [
      { field: "placement", label: "Posição", kind: "badge" },
      { field: "supplier", label: "Empresa", kind: "relation" },
      { field: "endsAt", label: "Termina em", kind: "date" },
      { field: "clicks", label: "Cliques" },
    ],
    fields: [
      { name: "title", label: "Nome do anúncio", type: "text", required: true, hint: "Uso interno e texto alternativo da imagem." },
      { name: "supplierId", label: "Empresa anunciante", type: "relation", relation: { model: "supplier", label: "name" } },
      {
        name: "placement",
        label: "Posição no portal",
        type: "select",
        defaultValue: "home",
        options: PLACEMENTS.map((p) => ({ value: p.value, label: p.label, hint: `Imagem: ${p.size}` })),
      },
      { name: "image", label: "Imagem do banner", type: "image", required: true, hint: "Veja o tamanho indicado na posição escolhida." },
      { name: "link", label: "Link ao clicar", type: "url", placeholder: "https://… ou WhatsApp da empresa" },
      { name: "startsAt", label: "Começa em", type: "date", half: true, hint: "Vazio = já começa." },
      { name: "endsAt", label: "Termina em", type: "date", half: true, hint: "Vazio = sem data final." },
      { name: "published", label: "Ativo", type: "bool", side: true, defaultValue: true, hint: "Desligue para pausar." },
      { name: "order", label: "Prioridade", type: "number", side: true, defaultValue: 0, hint: "Maior número aparece primeiro." },
    ],
  },
  {
    key: "parceiros",
    model: "partner",
    module: "comercial",
    singular: "parceiro",
    plural: "Parceiros",
    gender: "o",
    icon: "handshake",
    description: "Parceiros, patrocinadores e apoiadores exibidos no site e nos eventos.",
    titleField: "name",
    imageField: "logo",
    publishField: "published",
    orderBy: [{ order: "asc" }, { name: "asc" }],
    tabs: publishedTabs,
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
    key: "avaliacoes",
    model: "review",
    module: "comercial",
    singular: "avaliação",
    plural: "Avaliações",
    gender: "a",
    icon: "star",
    description: "Avaliações enviadas pelos síndicos. Só aparecem no site depois de aprovadas.",
    titleField: "name",
    urlFilters: ["supplierId"],
    orderBy: [{ createdAt: "desc" }],
    include: { supplier: { select: { name: true } } },
    tabs: [
      { key: "pendente", label: "Aguardando", where: { status: "pendente" } },
      { key: "aprovada", label: "Aprovadas", where: { status: "aprovada" } },
      { key: "rejeitada", label: "Rejeitadas", where: { status: "rejeitada" } },
    ],
    columns: [
      { field: "supplier", label: "Empresa", kind: "relation" },
      { field: "rating", label: "Nota", kind: "stars" },
      { field: "status", label: "Situação", kind: "badge" },
      { field: "createdAt", label: "Enviada", kind: "date" },
    ],
    fields: [
      { name: "supplierId", label: "Empresa avaliada", type: "relation", relation: { model: "supplier", label: "name" }, required: true },
      { name: "name", label: "Nome de quem avaliou", type: "text", required: true, half: true },
      { name: "condo", label: "Condomínio", type: "text", half: true },
      { name: "rating", label: "Nota", type: "rating", defaultValue: 5 },
      { name: "comment", label: "Comentário", type: "textarea" },
      { name: "email", label: "E-mail (não aparece no site)", type: "text" },
      {
        name: "status",
        label: "Situação",
        type: "select",
        side: true,
        defaultValue: "aprovada",
        options: [
          { value: "pendente", label: "Aguardando aprovação" },
          { value: "aprovada", label: "Aprovada (aparece no site)" },
          { value: "rejeitada", label: "Rejeitada" },
        ],
      },
    ],
  },
  // ---------------- Conteúdo ----------------
  {
    key: "materias",
    model: "article",
    module: "conteudo",
    singular: "matéria",
    plural: "Matérias",
    gender: "a",
    icon: "newspaper",
    description: "Notícias e artigos do Informe-se.",
    titleField: "title",
    slugFrom: "title",
    imageField: "cover",
    publishField: "published",
    urlFilters: ["authorId", "sectionId"],
    orderBy: [{ publishedAt: "desc" }],
    include: { section: { select: { name: true } }, authorRef: { select: { name: true } } },
    tabs: [...publishedTabs, { key: "destaque", label: "Destaques", where: { featured: true } }],
    columns: [
      { field: "section", label: "Seção", kind: "relation" },
      { field: "authorRef", label: "Autor", kind: "relation" },
      { field: "publishedAt", label: "Data", kind: "date" },
      { field: "views", label: "Leituras" },
    ],
    publicPath: (i) => `/informe-se/${i.slug}`,
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "excerpt", label: "Resumo", type: "textarea", hint: "Duas ou três linhas que aparecem na lista." },
      { name: "content", label: "Texto da matéria", type: "markdown" },
      { name: "cover", label: "Imagem de capa", type: "image", side: true },
      { name: "sectionId", label: "Seção", type: "relation", relation: { model: "articleSection", label: "name" }, side: true },
      authorField,
      { name: "publishedAt", label: "Data de publicação", type: "datetime", side: true, hint: "Data futura = agenda a publicação." },
      { name: "featured", label: "Destaque na página inicial", type: "bool", side: true },
      published,
      slug,
    ],
  },
  {
    key: "autores",
    model: "author",
    module: "conteudo",
    singular: "autor",
    plural: "Autores e colunistas",
    gender: "o",
    icon: "users",
    description: "Colunistas e especialistas com página própria no portal.",
    titleField: "name",
    slugFrom: "name",
    imageField: "photo",
    publishField: "published",
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
    tabs: publishedTabs,
    columns: [
      { field: "role", label: "Atuação" },
      { field: "_count.articles", label: "Matérias" },
    ],
    publicPath: (i) => `/colunistas/${i.slug}`,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "role", label: "Atuação", type: "text", placeholder: "Ex.: Advogado condominial" },
      { name: "bio", label: "Sobre", type: "textarea" },
      { name: "email", label: "E-mail (não aparece no site)", type: "text", half: true },
      { name: "website", label: "Site", type: "url", half: true },
      { name: "instagram", label: "Instagram (link)", type: "url", half: true },
      { name: "linkedin", label: "LinkedIn (link)", type: "url", half: true },
      { name: "photo", label: "Foto", type: "image", side: true },
      published,
      order,
      slug,
    ],
  },
  {
    key: "tira-duvidas",
    model: "question",
    module: "conteudo",
    singular: "pergunta",
    plural: "Tira-Dúvidas",
    gender: "a",
    icon: "quote",
    description: "Perguntas enviadas pelos leitores. Responda e marque como publicada para aparecer no site.",
    titleField: "title",
    slugFrom: "title",
    publishField: "published",
    orderBy: [{ createdAt: "desc" }],
    include: { author: { select: { name: true } } },
    tabs: [
      { key: "pendente", label: "Aguardando resposta", where: { status: "pendente" } },
      { key: "publicada", label: "Publicadas", where: { status: "publicada" } },
      { key: "rejeitada", label: "Arquivadas", where: { status: "rejeitada" } },
    ],
    columns: [
      { field: "askerName", label: "Enviada por" },
      { field: "status", label: "Situação", kind: "badge" },
      { field: "author", label: "Respondida por", kind: "relation" },
      { field: "createdAt", label: "Recebida", kind: "date" },
    ],
    publicPath: (i) => (i.published ? `/tira-duvidas/${i.slug}` : null),
    fields: [
      { name: "title", label: "Pergunta (título)", type: "text", required: true },
      { name: "body", label: "Detalhes enviados pelo leitor", type: "textarea" },
      { name: "answer", label: "Resposta", type: "markdown", hint: "Escreva a resposta do especialista." },
      { name: "askerName", label: "Nome de quem perguntou", type: "text", required: true, half: true },
      { name: "askerCity", label: "Cidade", type: "text", half: true },
      { name: "askerEmail", label: "E-mail (não aparece no site)", type: "text" },
      {
        name: "status",
        label: "Situação",
        type: "select",
        side: true,
        defaultValue: "pendente",
        options: [
          { value: "pendente", label: "Aguardando resposta" },
          { value: "publicada", label: "Publicada" },
          { value: "rejeitada", label: "Arquivada" },
        ],
      },
      { name: "published", label: "Aparece no site", type: "bool", side: true, hint: "Ligue depois de responder." },
      { ...authorField, label: "Respondida por" },
      { name: "sectionId", label: "Assunto", type: "relation", relation: { model: "articleSection", label: "name" }, side: true },
      slug,
    ],
  },
  {
    key: "videos",
    model: "video",
    module: "conteudo",
    singular: "vídeo",
    plural: "Vídeos",
    gender: "o",
    icon: "youtube",
    description: "Vídeos do YouTube exibidos na página de vídeos e na página inicial.",
    titleField: "title",
    slugFrom: "title",
    publishField: "published",
    orderBy: [{ publishedAt: "desc" }],
    tabs: publishedTabs,
    columns: [{ field: "publishedAt", label: "Data", kind: "date" }],
    publicPath: () => `/videos`,
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "url", label: "Link do YouTube", type: "url", required: true, placeholder: "https://www.youtube.com/watch?v=…" },
      { name: "description", label: "Descrição", type: "textarea" },
      authorField,
      { name: "publishedAt", label: "Data", type: "datetime", side: true },
      { name: "featured", label: "Destaque na página inicial", type: "bool", side: true },
      published,
      slug,
    ],
  },
  // ---------------- Agenda ----------------
  {
    key: "eventos",
    model: "event",
    module: "agenda",
    singular: "evento",
    plural: "Eventos",
    gender: "o",
    icon: "calendar",
    description: "Encontros de síndicos, palestras e feiras. As inscrições ficam na página de cada evento.",
    titleField: "title",
    slugFrom: "title",
    imageField: "cover",
    publishField: "published",
    orderBy: [{ startsAt: "desc" }],
    include: { _count: { select: { registrations: true } } },
    tabs: publishedTabs,
    columns: [
      { field: "startsAt", label: "Data", kind: "date" },
      { field: "city", label: "Cidade" },
      { field: "_count.registrations", label: "Inscritos" },
    ],
    publicPath: (i) => `/eventos/${i.slug}`,
    fields: [
      { name: "title", label: "Nome do evento", type: "text", required: true },
      { name: "excerpt", label: "Chamada", type: "textarea" },
      { name: "description", label: "Programação / detalhes", type: "markdown" },
      { name: "venue", label: "Local", type: "text", half: true, placeholder: "Ex.: Hotel Slaviero" },
      { name: "city", label: "Cidade", type: "text", half: true },
      { name: "address", label: "Endereço", type: "text" },
      { name: "sponsors", label: "Patrocinadores", type: "relationMany", relation: { model: "partner", label: "name" }, hint: "Cadastre em Parceiros." },
      { name: "certificateUrl", label: "Link do certificado (após o evento)", type: "url", hint: "Liberado só para inscritos marcados como presentes." },
      { name: "link", label: "Inscrição externa (opcional)", type: "url", hint: "Vazio = inscrição pelo próprio site." },
      { name: "cover", label: "Imagem", type: "image", side: true },
      { name: "startsAt", label: "Data e hora", type: "datetime", side: true },
      { name: "registrationOpen", label: "Inscrições abertas", type: "bool", side: true, defaultValue: true },
      { name: "capacity", label: "Vagas", type: "number", side: true, hint: "0 = sem limite." },
      published,
      slug,
    ],
  },
  {
    key: "cursos",
    model: "course",
    module: "agenda",
    singular: "curso",
    plural: "Cursos",
    gender: "o",
    icon: "book",
    description: "Cursos e capacitações para síndicos.",
    titleField: "title",
    slugFrom: "title",
    imageField: "cover",
    publishField: "published",
    orderBy: [{ startsAt: "desc" }],
    tabs: publishedTabs,
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
  // ---------------- Organização ----------------
  {
    key: "categorias",
    model: "category",
    module: "comercial",
    singular: "categoria",
    plural: "Categorias de fornecedores",
    gender: "a",
    icon: "grid",
    description: "Especialidades usadas para filtrar fornecedores.",
    titleField: "name",
    slugFrom: "name",
    publishField: "published",
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
    module: "conteudo",
    singular: "seção",
    plural: "Seções de matérias",
    gender: "a",
    icon: "layers",
    description: "Jurídico, Manutenção, Finanças… usadas no Informe-se e no Tira-Dúvidas.",
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
