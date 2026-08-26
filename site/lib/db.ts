import { Pool } from "pg";

export type Offre = {
  url: string;
  slug: string;
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
  indemnite: string | null;
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
      // Supabase (comme Neon/Vercel Postgres) exige TLS ; une base locale
      // de dev n'en a pas.
      ssl: local ? false : { rejectUnauthorized: false },
      // Chaque instance de fonction serverless Vercel a SON PROPRE process
      // Node (le singleton globalThis n'aide qu'entre requêtes d'UNE MÊME
      // instance déjà chaude) : on garde donc peu de connexions par pool
      // pour ne pas cumuler avec les autres instances. Utiliser l'URL du
      // "connection pooler" Supabase (port 6543, mode transaction) pour
      // DATABASE_URL côté site limite encore plus ce risque — voir
      // Settings → Database → Connection pooling sur Supabase.
      max: 3,
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
    `SELECT url, slug, poste, entite, ville, description, domaine, type_stage,
            duree, source, date_pub_iso, age_jours, fenetre, candidats,
            indemnite, premiere_detection, derniere_verification
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

/** Une offre par son slug (page de détail), ou null si absente/base non
 * configurée — la page appelante distingue les deux via getPool(). */
export async function getOffreBySlug(slug: string): Promise<Offre | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<Offre>(
    `SELECT url, slug, poste, entite, ville, description, domaine, type_stage,
            duree, source, date_pub_iso, age_jours, fenetre, candidats,
            indemnite, premiere_detection, derniere_verification
     FROM offres WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getDerniereMaj(): Promise<string | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<{ max: string | null }>(
    "SELECT MAX(derniere_verification) AS max FROM offres"
  );
  return rows[0]?.max ?? null;
}
