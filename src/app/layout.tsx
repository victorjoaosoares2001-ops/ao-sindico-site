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
    // SVG de 318 bytes no lugar do PNG grande usado anteriormente como favicon.
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
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
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var c=navigator.connection,m=navigator.deviceMemory||0,h=navigator.hardwareConcurrency||0;if(c&&(c.saveData||/slow-2g|2g/.test(c.effectiveType))||(m&&m<=4)||(h&&h<=4))document.documentElement.classList.add('lite')}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
