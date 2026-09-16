/**
 * Wrapper de linha de comando para importRealExams() — usar em desenvolvimento
 * local: `npm run db:import-real-exams`.
 * Em produção (Vercel), a mesma função é chamada pela rota /api/setup.
 */
import { importRealExams } from "./import-real-exams";
import { pool } from "./index";

importRealExams()
  .then(async (log) => {
    console.log(log.join("\n"));
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
