import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A rota /api/setup lê os arquivos .sql de migração em runtime (via
  // drizzle-orm/node-postgres/migrator) — sem isto, o Vercel não inclui a
  // pasta drizzle/ no pacote da função e a rota falharia em produção.
  outputFileTracingIncludes: {
    "/api/setup": ["./drizzle/**"],
  },
};

export default nextConfig;
