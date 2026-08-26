import { Pool } from "pg";

// Pool UNIQUE et partagé par tout le site (db.ts, abonnes.ts, admin.ts).
// Historiquement chaque module avait son propre Pool ("isoler les écritures
// peu fréquentes des lectures à fort trafic") -- en pratique, sur le
// connection pooler Supabase (pgbouncer), chaque Pool ouvre SES PROPRES
// connexions clientes en plus des autres : avec 3 pools x plusieurs
// instances serverless Vercel en parallèle, le nombre total de connexions
// clientes dépassait la limite du pooler ("EMAXCONNSESSION: max clients
// reached"), notamment au chargement du tableau de bord admin (plusieurs
// requêtes en parallèle sur des pools différents). Un seul pool partagé,
// avec un `max` volontairement bas, règle ça sans rien perdre en pratique
// (le trafic de ce site reste largement en dessous de ce qui justifierait
// une isolation stricte).
const globalForPg = globalThis as unknown as { _pgPoolPartage?: Pool };

export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!globalForPg._pgPoolPartage) {
    const local = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    globalForPg._pgPoolPartage = new Pool({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForPg._pgPoolPartage;
}
