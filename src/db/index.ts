import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Configure a variável de ambiente com a string de conexão do Postgres (local, Neon, Supabase etc.)."
  );
}

// Conexões locais (desenvolvimento) não usam SSL. Qualquer Postgres gerenciado
// remoto (Neon, Supabase, Render, RDS...) normalmente exige SSL — habilitado
// automaticamente quando o host não é local.
const isLocalHost = /(localhost|127\.0\.0\.1)/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
