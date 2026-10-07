// Conteúdo inicial migrado do site atual (aosindico.com), outubro/2026.
// Imagens continuam apontando para o servidor atual até a migração dos arquivos.

const IMG = "https://aosindico.com/storage";

export const CATEGORIES = [
  { name: "Administração", icon: "briefcase", description: "Administradoras, contabilidade, crédito e gestão." },
  { name: "Infraestrutura", icon: "zap", description: "Elétrica, engenharia, laudos e soluções para o prédio." },
  { name: "Obras e Reformas", icon: "wrench", description: "Reformas, impermeabilização, telhados e estrutura." },
  { name: "Serviços Gerais", icon: "sparkles", description: "Limpeza, conservação, jardinagem e manutenção." },
  { name: "Segurança e Portaria", icon: "shield", description: "Portaria, monitoramento e controle de acesso." },
  { name: "Pintura e Fachadas", icon: "paint", description: "Pintura predial, restauração e lavagem de fachadas." },
  { name: "Síndico Profissional", icon: "users", description: "Síndicos profissionais para administrar seu condomínio." },
];

export const SECTIONS = ["Convivência", "Dicas", "Finanças", "Jurídico", "Legislação", "Manutenção", "Mercado Imobiliário", "Notícias", "Segurança"];

export const SUPPLIERS = [
  {
    name: "Innovare Pinturas Prediais",
    tagline: "Pintura predial e restauração de fachadas para condomínios.",
    logo: `${IMG}/banners/innovare-pinturas-prediais_174301.png`,
    categories: ["Pintura e Fachadas", "Obras e Reformas"],
    plan: "premium",
    featured: true,
  },
  {
    name: "Polytel",
    tagline: "Monitoramento e portaria para condomínios.",
    logo: `${IMG}/banners/polytel-7_204346.png`,
    categories: ["Segurança e Portaria"],
    plan: "premium",
    featured: true,
  },
  {
    name: "F.R Segurança e Serviços",
    description:
      "Fundada em 2014 pelos sócios Fabiano e Robson, a FR Segurança e Serviços tem ganhado força no mercado, ajudando condomínios e empresas a se destacarem pela segurança e limpeza dos ambientes. Somos uma equipe dedicada a fornecer serviços de alta qualidade, com soluções personalizadas e confiáveis para as necessidades de cada cliente.",
    services: "Controle de acesso e segurança, Recepcionista, Manobrista, Jardinagem, Limpeza e conservação, Limpeza pós-obras, Serviços de manutenção",
    categories: ["Administração", "Serviços Gerais", "Infraestrutura", "Segurança e Portaria"],
    plan: "verificado",
    featured: true,
  },
  {
    name: "Telhamar",
    description:
      "A Telhamar atua no mercado há mais de 30 anos, com ampla variedade de obras e produtos de alta qualidade. Preza pela eficiência, aperfeiçoamento e sofisticação, alcançando excelência em desempenho e bom gosto em cada obra executada.",
    services:
      "Acessórios para churrasco, Churrasqueira de alvenaria, Depósito de materiais de construção, Impermeabilizantes, Impermeabilização de caixas d'água, Impermeabilização de lajes, Instalação de coifas, Telhas calhas e rufos",
    categories: ["Obras e Reformas", "Serviços Gerais"],
    plan: "verificado",
    featured: true,
  },
  {
    name: "Somar Engenharia",
    services: "A.R.T. - serviços técnicos, Laudos técnicos, Projetos AVCB / CLCB, Consultoria e visita técnica, Serviços técnicos de engenharia",
    categories: ["Infraestrutura"],
    featured: true,
  },
  {
    name: "Franklin Oliveira Pinturas e Reformas em Geral",
    services:
      "Alvenaria, Demarcação de garagem, Drywall e divisórias, Lavagem e restauração de fachada, Limpeza hidrojateada, Limpeza de vidros da fachada, Manutenção preventiva, Impermeabilização de lajes, Obras e reformas, Pintura predial, Pinturas técnicas e decorativas, Quadras – construção e reformas, Recuperação estrutural, Revestimento e acabamento, Sancas e gesso decorativo, Tratamento de trincas",
    categories: ["Serviços Gerais", "Pintura e Fachadas"],
    featured: true,
  },
  {
    name: "Grupo Etmo",
    services: "Home equity e auto equity, Crédito imobiliário, Crédito para veículos, Consórcios, Empréstimo com garantia, Capital de giro",
    categories: ["Administração", "Infraestrutura"],
  },
  {
    name: "Mini Pet Store",
    description:
      "Loja autônoma, sem funcionários, instalada dentro de condomínios residenciais. Oferece produtos essenciais para cães e gatos, com reposição inteligente e monitoramento remoto — conveniência e segurança para os moradores.",
    services: "Rações e petiscos, Brinquedos, Higiene, Acessórios para cães, Acessórios para gatos",
    categories: ["Infraestrutura"],
  },
  { name: "Comercial Elétrica EJN", categories: ["Infraestrutura"] },
  {
    name: "Adriana Santos",
    tagline: "Síndica profissional",
    description:
      "Profissional com vasta experiência no mercado condominial, além da formação técnica e acadêmica. Comunicação assertiva com a massa condominial através de boletins periódicos, plantões de atendimento e reuniões com o corpo diretivo.",
    categories: ["Síndico Profissional"],
  },
  {
    name: "Agatha Cristhina Campos Kanashiro",
    tagline: "Síndica profissional",
    description:
      "Administração geral, gestão financeira e logística, controle de pagamentos e recebimentos, gestão de pessoas e departamento pessoal, elaboração orçamentária e habilidade com contratos.",
    categories: ["Síndico Profissional"],
  },
  {
    name: "Alessandra Cristina Bernardes",
    tagline: "Síndica profissional",
    description:
      "Atua exclusivamente como síndica profissional em condomínios comerciais e residenciais, por meio da ACBernardes Consultoria, com equipe capacitada para atender várias situações.",
    categories: ["Síndico Profissional"],
  },
];

const BIO_MARCELO =
  "Advogado atuante no direito civil, especificamente direito condominial, educacional e consumidor. Presidente da Comissão Educacional OAB/SP (22/24).";

export const ARTICLES = [
  {
    title: "Curatela: proteger quem amamos também é um ato de cuidado",
    section: "Convivência",
    author: "Marcelo Machado Almeida",
    authorBio: BIO_MARCELO,
    cover: `${IMG}/posts/whatsapp-image-2026-10-02-at-093721jpeg_112152.jpg`,
    date: "2026-10-02T10:00:00-03:00",
    featured: true,
    excerpt:
      "Com o aumento da expectativa de vida, muitas famílias se perguntam como ajudar um ente querido de forma legal e segura. A curatela pode ser a solução.",
    content: `Com o aumento da expectativa de vida da população e o crescimento do número de pessoas que convivem com doenças como Alzheimer, demências e outras condições que afetam a capacidade de tomar decisões, muitas famílias se deparam com uma dúvida importante: como ajudar um ente querido de forma legal e segura? Nessas situações, a curatela pode ser a solução mais adequada.

Ao contrário do que muitas pessoas imaginam, a curatela não existe para retirar direitos ou limitar a liberdade de alguém. Sua principal finalidade é proteger pessoas que, por causa de uma doença, deficiência ou outra condição, já não conseguem praticar determinados atos da vida civil com segurança.

Na prática, a Justiça nomeia uma pessoa de confiança, chamada **curador**, para auxiliar ou representar aquele familiar nos atos que ele não consegue realizar sozinho, como administrar bens, movimentar contas bancárias, assinar documentos, resolver questões previdenciárias ou cuidar de assuntos patrimoniais.

## Proteção na medida necessária

A legislação brasileira estabelece que essa proteção deve ocorrer apenas na medida necessária. Isso significa que a pessoa submetida à curatela continua mantendo sua autonomia sempre que tiver condições de exercer seus direitos. Cada caso é analisado individualmente pelo Poder Judiciário, levando em consideração laudos médicos, perícias e as necessidades concretas daquela pessoa.

Muitas famílias deixam para procurar orientação apenas quando surge um problema, como um golpe financeiro, um contrato assinado sem compreensão de suas consequências ou um conflito entre parentes sobre a administração do patrimônio. Nessas situações, o prejuízo pode ser muito maior, tanto do ponto de vista financeiro quanto emocional.

Buscar orientação jurídica de forma preventiva permite que a família compreenda quais são os direitos da pessoa vulnerável, quais documentos serão necessários e qual é o procedimento mais adequado para cada situação.

Também é importante lembrar que pessoas com deficiência não precisam, necessariamente, de curatela. A legislação prestigia a autonomia e a inclusão, razão pela qual essa medida somente deve ser adotada quando realmente indispensável.

> Mais do que um procedimento judicial, a curatela representa um instrumento de proteção da dignidade humana.

**Fundamentação legal:** Código Civil (arts. 1.767 a 1.783), Código de Processo Civil (arts. 747 a 763) e Lei nº 13.146/2015 (Lei Brasileira de Inclusão da Pessoa com Deficiência).`,
  },
  {
    title: "Animais em condomínio: pode proibir ou existem limites legais?",
    section: "Notícias",
    author: "Marcelo Machado Almeida",
    authorBio: BIO_MARCELO,
    cover: `${IMG}/posts/marcelo-almeida-imagem-1jpeg_163639.jpg`,
    date: "2026-09-01T10:00:00-03:00",
    excerpt:
      "Cães, gatos e até animais exóticos fazem parte da rotina de milhares de famílias. O condomínio pode proibir? O que diz a lei?",
    content: `A presença de animais de estimação em condomínios é cada vez mais comum. Cães, gatos e até animais exóticos fazem parte da rotina de milhares de famílias. No entanto, surgem conflitos recorrentes: o condomínio pode proibir animais? E se o animal causar barulho ou risco? A resposta exige equilíbrio entre o direito de propriedade e o direito à convivência coletiva.

## O que diz a legislação

O Código Civil não proíbe a presença de animais em condomínios. Pelo contrário, estabelece limites baseados na convivência: garante ao condômino o direito de usar sua unidade; proíbe o uso que prejudique sossego, salubridade e segurança; e protege o direito de vizinhança contra interferências prejudiciais. Ou seja, **o problema não é ter o animal, mas o comportamento que ele gera.**

> STJ – REsp 1.783.076/SP: a convenção condominial não pode proibir genericamente a permanência de animais nas unidades autônomas, salvo se comprovado prejuízo à segurança, higiene ou sossego.

## Quando o condomínio pode agir

- Barulho excessivo (latidos constantes, por exemplo);
- Risco à segurança (animais agressivos sem controle);
- Problemas de higiene (fezes em áreas comuns);
- Circulação inadequada (sem guia ou focinheira quando exigida).

Nesses casos, cabem advertência, multa conforme a convenção e, em situações extremas, medidas judiciais.

## O papel do síndico

A atuação deve ser **técnica** (baseada na convenção, regimento e legislação), **proporcional** (evitando medidas arbitrárias — se possível, levando o tema à assembleia) e **preventiva**, com regras claras de guia, circulação e higiene.

E para os condôminos: manter o animal sob controle, evitar barulho excessivo, recolher sujeiras imediatamente e respeitar as áreas comuns.

A convivência com animais em condomínios é plenamente possível e legal. Mais do que restringir, o caminho é educar, regulamentar e conviver com responsabilidade.

**Fontes:** Código Civil – Lei nº 10.406/2002; STJ – REsp 1.783.076/SP; jurisprudência do TJSP.`,
  },
  {
    title: "Proprietário pode pedir o imóvel antes do fim do contrato?",
    section: "Jurídico",
    author: "Marcelo Machado Almeida",
    authorBio: BIO_MARCELO,
    cover: `${IMG}/posts/marcelo-almeida-imagem-2jpeg_163852.jpg`,
    date: "2026-09-01T09:00:00-03:00",
    excerpt: "A resposta depende do tipo de contrato, de eventual descumprimento e das hipóteses previstas na Lei do Inquilinato.",
    content: `A locação de imóveis é uma das relações contratuais que mais geram conflitos no Brasil. Um dos principais questionamentos é: o proprietário pode pedir o imóvel antes do término do contrato? A resposta depende do tipo de contrato firmado, da existência de descumprimento contratual e das hipóteses previstas na Lei do Inquilinato (Lei nº 8.245/1991).

Muitas pessoas acreditam que o proprietário pode simplesmente solicitar o imóvel "quando quiser", por ser o dono do bem. Juridicamente, isso não funciona dessa forma.

> Art. 4º da Lei do Inquilinato: durante o prazo estipulado para a duração do contrato, não poderá o locador reaver o imóvel alugado.

## Quando a locação pode ser desfeita

- Mútuo acordo;
- Infração legal ou contratual;
- Falta de pagamento de aluguel ou encargos;
- Reparações urgentes determinadas pelo Poder Público.

## Quando o proprietário NÃO pode pedir o imóvel

Se o contrato estiver vigente e regular, o inquilino tem direito à permanência mesmo que o dono queira vender, tenha encontrado alguém pagando mais, mude de ideia ou o imóvel tenha valorizado.

## Cuidados para os dois lados

**Proprietário:** contrato bem estruturado, vistoria detalhada, notificações formais e nunca retirada forçada.

**Inquilino:** ler todo o contrato, guardar comprovantes, fazer vistoria de entrada e formalizar a entrega das chaves.

O conhecimento jurídico preventivo evita litígios, prejuízos financeiros e desgastes emocionais para ambas as partes.`,
  },
  {
    title: "O papel do síndico na mediação dos conflitos condominiais",
    section: "Dicas",
    author: "Portal Ao Síndico",
    cover: `${IMG}/banners/mediador_165720.png`,
    date: "2026-08-20T10:00:00-03:00",
    featured: true,
    excerpt: "Cinco técnicas para o síndico manter a paz e a harmonia no condomínio — da escuta à documentação do processo.",
    content: `O síndico deve estar apto a conscientizar os condôminos de que estão compartilhando um espaço com pessoas de diferentes valores, formação e opiniões. Apesar de a unidade ser autônoma, ela faz parte de um todo.

## 1. Escutar para entender

Busque reuniões individuais com as partes, em horários e locais de comum acordo. Mostre-se interessado, sem julgamentos e sem demonstrar emoções. Ser um bom ouvinte tranquiliza as pessoas e ajuda a entender o conflito.

## 2. Boa comunicação e postura

Portar-se de maneira cordial e respeitosa é a chave para ganhar a confiança das partes, que precisam sentir que lidam com alguém neutro e interessado na melhor solução.

## 3. Pedir ajuda não é demérito

Uma segunda opinião de quem já viveu situação semelhante pode apontar caminhos. Mas lembre-se: o mediador é você.

## 4. Negociação

Tenha em mãos as normas do condomínio. A questão não é dar razão a um lado, mas buscar um entendimento que normalize a convivência. Um litígio costuma ser mais desgastante, caro e demorado.

## 5. Documente todo o processo

Anotações ajudam no acompanhamento, mostram a evolução do diálogo e deixam lições para os próximos casos.

> As melhores empresas e informações estão no Portal Ao Síndico.`,
  },
  {
    title: "Teste de percussão: o que é e qual a importância",
    section: "Manutenção",
    author: "Portal Ao Síndico",
    cover: `${IMG}/banners/dca_111132.jpg`,
    date: "2026-07-15T10:00:00-03:00",
    excerpt: "Um check-up da fachada: entenda como o teste identifica problemas antes que fiquem graves — e o que diz a norma.",
    content: `Manter o bem-estar e a segurança de todos é obrigação do síndico. Por isso, entender o que é o teste de percussão e como ele protege o condomínio é essencial.

## O que é

É uma forma de verificar a estabilidade de revestimentos e estruturas para identificar problemas de maneira rápida e simples — como um check-up médico do prédio. O técnico aplica golpes controlados e observa como o som se propaga em diferentes pontos.

## O que diz a lei

Conforme a **NBR 13.755:2017**, as placas cerâmicas devem estar firmes ao substrato. E, pelo artigo 1.348 do Código Civil, cabe ao síndico zelar pela conservação do condomínio — por isso é importante contratar empresa especializada e realizar testes periódicos na fachada.

## Benefícios

- Identifica anomalias no início, economizando tempo e dinheiro;
- Cria um ambiente mais seguro para moradores;
- Orienta uma manutenção eficaz e durável.

Muitas falhas encontradas estão ligadas à instalação do revestimento: argamassa de má qualidade, fora das especificações ou aplicação inadequada.

> A prevenção é o melhor caminho.`,
  },
  {
    title: "Controle de acesso: 4 sinais de que é necessário melhorar",
    section: "Segurança",
    author: "Portal Ao Síndico",
    cover: `${IMG}/banners/ces_101009.jpg`,
    date: "2026-06-30T10:00:00-03:00",
    excerpt: "Falta de monitoramento, falhas na checagem de identidade, usuários sem treinamento e equipamentos sem manutenção.",
    content: `Seja em condomínios residenciais ou empresariais, o controle de acesso é a etapa que permite a entrada de quem está autorizado e impede quem tem más intenções.

Criminosos se passam por prestadores de serviço, conhecidos ou até moradores. Por isso o controle de acesso eficiente é, antes de tudo, prevenção.

## 4 erros cruciais

**1. Falta de monitoramento** das áreas comuns, portaria e garagem.

**2. Falha na checagem de identidade** de visitantes e prestadores.

**3. Falta de treinamento** de moradores e funcionários — senhas compartilhadas e portas abertas.

**4. Equipamentos sem manutenção** ou desatualizados. O barato pode sair caro.

## Como melhorar

- Criar um planejamento de segurança com os pontos vulneráveis;
- Investir em tecnologia (reconhecimento facial, portaria remota, verificação à distância);
- Contar com profissionais treinados.

Quanto mais completo o controle de acesso, menores as chances de invasão.`,
  },
  {
    title: "Lei do Porteiro: entenda a legislação, os direitos e deveres desse profissional",
    section: "Jurídico",
    author: "Cintia Lima",
    cover: `${IMG}/banners/seyy_210700.jpg`,
    date: "2026-06-10T10:00:00-03:00",
    excerpt: "O que muda com a Lei nº 12.740/2012, jornada, folgas e as principais atribuições do porteiro.",
    content: `A Lei nº 12.740/2012 alterou o artigo 193 da CLT, incluindo os porteiros entre as categorias que exercem atividades perigosas — com direito a adicional de periculosidade de 30% sobre o salário-base nas situações de risco previstas.

## Pontos principais

- **Jornada:** 8 horas diárias e 44 semanais, com possibilidade de até 2 horas extras mediante acordo;
- **Intervalo:** uma hora para refeição e descanso;
- **Folga semanal remunerada**, preferencialmente aos domingos;
- **Registro em carteira**, com piso definido pela convenção coletiva.

## Deveres do porteiro

- Cumprir o horário e usar uniforme e crachá;
- Conhecer as normas internas e orientar visitantes;
- Verificar identidade e destino antes de liberar a entrada;
- Registrar entradas e saídas de pessoas e veículos;
- Receber e encaminhar correspondências e encomendas;
- Acionar o síndico em emergências ou situações suspeitas.

Consulte sempre a convenção coletiva e o sindicato local para valores e regras da sua região.`,
  },
];

export const EVENTS = [
  {
    title: "8º Encontro de Síndicos de Guarulhos e Região",
    excerpt: "Síndicos de Guarulhos, inscrevam-se já para o nosso 8º Encontro, no Hotel Slaviero Guarulhos.",
    description:
      "Um encontro para trocar experiências, conhecer fornecedores e se atualizar sobre gestão condominial.\n\nAo final, os participantes podem baixar o **certificado de participação**.",
    venue: "Hotel Slaviero Guarulhos",
    city: "Guarulhos · SP",
    startsAt: "2026-12-05T00:00:00-03:00",
  },
];

export const CAMPAIGNS = [
  {
    title: "Anuncie aqui",
    image: `${IMG}/banners/anunc-132638_233231.jpg`,
    link: "https://wa.me/5511940056720?text=Quero%20falar%20com%20uma%20consultora%20do%20Portal",
    placement: "home",
    order: 1,
  },
  { title: "Topo Pinturas", image: `${IMG}/banners/img-1619jpg_092323.jpg`, link: "/fornecedores?q=topo", placement: "home", order: 2 },
  {
    title: "Síndico Profissional",
    image: `${IMG}/banners/curso_112237.png`,
    link: "/fornecedores?categoria=sindico-profissional",
    placement: "home",
    order: 3,
  },
  { title: "Grupo de WhatsApp Ao Síndico", image: `${IMG}/banners/wha_142307.jpg`, link: "https://chat.whatsapp.com/FshM0uufkJuAyyKvvEUjwX", placement: "home", order: 4 },
  { title: "EXTINSERV", image: `${IMG}/banners/whatsapp-image-2026-09-04-at-170515jpeg_170614.jpg`, link: "https://extinserv.com.br/", placement: "materia", order: 1 },
  { title: "A4 Controle de Pragas", image: `${IMG}/banners/17871787691102_193836.jpg`, link: null, placement: "materia", order: 2 },
];
