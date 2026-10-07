import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  poweredByHeader: false,
  // Endereços do site antigo → novos (preserva links compartilhados e o Google)
  async redirects() {
    return [
      { source: "/informe/:slug", destination: "/informe-se/:slug", permanent: true },
      { source: "/informe-se/:secao(convivencia|dicas|financas|juridico|legislacao|manutencao|mercado-imobiliario|noticias|seguranca)", destination: "/informe-se?secao=:secao", permanent: true },
      { source: "/fornecedor/:slug", destination: "/fornecedores/:slug", permanent: true },
      { source: "/sindico-profissional", destination: "/sindicos-profissionais", permanent: true },
      { source: "/sindico-profissional/:slug", destination: "/fornecedores/:slug", permanent: true },
      { source: "/colunista/:slug", destination: "/colunistas/:slug", permanent: true },
      { source: "/tiraduvidas", destination: "/tira-duvidas", permanent: true },
      { source: "/tiraduvidas/perguntar", destination: "/tira-duvidas#perguntar", permanent: true },
      { source: "/tiraduvidas/:id/:slug", destination: "/tira-duvidas/:slug", permanent: true },
      { source: "/panel", destination: "/admin", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
