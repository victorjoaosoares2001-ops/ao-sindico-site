import { RESOURCES } from "@/admin/resources";
import { AdminShell } from "@/components/admin/Shell";
import type { IconName } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, ROLES, type Module } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Item = { href: string; label: string; icon: IconName; badge?: number; module: Module };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [unread, pendingReviews, pendingQuestions] = await Promise.all([
    db.message.count({ where: { status: "novo" } }),
    db.review.count({ where: { status: "pendente" } }),
    db.question.count({ where: { status: "pendente" } }),
  ]);
  const res = (key: string, badge?: number): Item => {
    const r = RESOURCES.find((x) => x.key === key)!;
    return { href: `/admin/${r.key}`, label: r.plural, icon: r.icon, module: r.module, badge };
  };

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Dia a dia",
      items: [
        { href: "/admin", label: "Início", icon: "home", module: "agenda" },
        { href: "/admin/mensagens", label: "Orçamentos e mensagens", icon: "inbox", badge: unread, module: "mensagens" },
      ],
    },
    { title: "Comercial", items: [res("fornecedores"), res("anuncios"), res("parceiros"), res("avaliacoes", pendingReviews)] },
    { title: "Conteúdo", items: [res("materias"), res("tira-duvidas", pendingQuestions), res("videos"), res("autores")] },
    { title: "Agenda", items: [res("eventos"), res("cursos")] },
    {
      title: "Configurações",
      items: [
        { href: "/admin/conteudo", label: "Textos do site", icon: "layout", module: "site" },
        res("categorias"),
        res("secoes"),
        { href: "/admin/equipe", label: "Equipe e acessos", icon: "users", module: "equipe" },
        { href: "/admin/historico", label: "Histórico", icon: "clock", module: "historico" },
      ],
    },
  ];

  const visible = groups
    .map((g) => ({ title: g.title, items: g.items.filter((i) => i.href === "/admin" || can(user.role, i.module)).map(({ module: _m, ...rest }) => rest) }))
    .filter((g) => g.items.length);

  return (
    <AdminShell user={{ ...user, roleLabel: ROLES[user.role as keyof typeof ROLES] ?? user.role }} groups={visible}>
      {children}
    </AdminShell>
  );
}
