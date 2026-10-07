import { RESOURCES } from "@/admin/resources";
import { AdminShell } from "@/components/admin/Shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const unread = await db.message.count({ where: { status: "novo" } });
  const res = (key: string) => {
    const r = RESOURCES.find((x) => x.key === key)!;
    return { href: `/admin/${r.key}`, label: r.plural, icon: r.icon };
  };

  const groups = [
    {
      title: "Dia a dia",
      items: [
        { href: "/admin", label: "Início", icon: "home" as const },
        { href: "/admin/mensagens", label: "Mensagens", icon: "inbox" as const, badge: unread },
      ],
    },
    { title: "Comercial", items: [res("fornecedores"), res("anuncios"), res("parceiros")] },
    { title: "Conteúdo", items: [res("materias"), res("eventos"), res("cursos")] },
    {
      title: "Configurações",
      items: [
        { href: "/admin/conteudo", label: "Textos do site", icon: "layout" as const },
        res("categorias"),
        res("secoes"),
        { href: "/admin/equipe", label: "Equipe e senha", icon: "users" as const },
      ],
    },
  ];

  return (
    <AdminShell user={user} groups={groups}>
      {children}
    </AdminShell>
  );
}
