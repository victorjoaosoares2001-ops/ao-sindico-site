import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import { isIndexable, siteUrl } from "@/lib/site-url";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["italic"], variable: "--font-serif", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = siteUrl();
  // caminho vem do middleware; canonical sempre no domínio oficial e sem parâmetros de filtro
  const path = (await headers()).get("x-pathname") ?? "/";
  return {
    metadataBase: new URL(base),
    alternates: { canonical: `${base}${path === "/" ? "" : path}` || base },
    robots: isIndexable() ? undefined : { index: false, follow: false },
    title: { default: "Ao Síndico — orçamentos, fornecedores e conteúdo para condomínios", template: "%s | Ao Síndico" },
    description: s.seo_description,
    openGraph: { type: "website", locale: "pt_BR", siteName: "Ao Síndico" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#1b1c20",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
