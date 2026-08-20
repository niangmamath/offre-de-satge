import { Pool } from "pg";

export type Offre = {
  url: string;
  poste: string;
  entite: string | null;
  ville: string | null;
  description: string | null;
  domaine: string | null;
  type_stage: string | null;
  duree: string | null;
  source: string | null;
  date_pub_iso: string | null;
  age_jours: number | null;
  fenetre: string;
  candidats: number | null;
  premiere_detection: string;
  derniere_verification: string;
};

// Singleton via globalThis : en dev, le rechargement à chaud (HMR) réimporte
// ce module sans redémarrer le process Node — sans ce garde-fou, chaque
// rechargement recréerait un pool et finirait par épuiser les connexions.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!globalForPg._pgPool) {
    const local = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    globalForPg._pgPool = new Pool({
      connectionString,
      // Neon/Vercel Postgres exigent TLS ; une base locale de dev n'en a pas.
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return globalForPg._pgPool;
}

/** null = DATABASE_URL absente (site pas encore relié à une base) — distinct
 * d'une liste vide (base connectée mais aucune offre convenable pour l'instant). */
export async function getOffres(): Promise<Offre[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<Offre>(
    `SELECT url, poste, entite, ville, description, domaine, type_stage,
            duree, source, date_pub_iso, age_jours, fenetre, candidats,
            premiere_detection, derniere_verification
     FROM offres
     ORDER BY
       CASE fenetre
         WHEN 'NOUVEAU' THEN 0
         WHEN 'OUVERTE' THEN 1
         WHEN 'ROUVERTE' THEN 2
         WHEN 'VIVIER' THEN 3
         WHEN 'AGÉE' THEN 4
         ELSE 5
       END,
       age_jours ASC NULLS LAST`
  );
  return rows;
}

export async function getDerniereMaj(): Promise<string | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<{ max: string | null }>(
    "SELECT MAX(derniere_verification) AS max FROM offres"
  );
  return rows[0]?.max ?? null;
}
