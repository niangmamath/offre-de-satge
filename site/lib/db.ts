import { Pool } from "pg";
import { createHash, randomUUID } from "crypto";

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

export type OffreAdmin = Offre & { masque: boolean; manuel: boolean };

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
     WHERE masque = FALSE
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
     FROM offres WHERE slug = $1 AND masque = FALSE LIMIT 1`,
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

// --- Administration (CMS) -------------------------------------------------
// Contrat avec db_sync.py (pipeline Python) : "masque" et "manuel" ne sont
// JAMAIS écrites par ce dernier (colonnes additives absentes de son
// UPSERT_SQL) -- une offre masquée par un admin le reste même après un
// re-scraping, et une offre manuelle ne sera jamais supprimée par la purge
// du pipeline (cf. commentaire dans db_sync.py:sync()).

/** Même algorithme que db_sync._slug() (Python) : stable par construction
 * (ne dépend que de l'URL), donc un lien déjà partagé reste valide. */
function slugify(url: string, poste: string): string {
  const base = poste
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  const suffixe = createHash("sha1").update(url).digest("hex").slice(0, 8);
  return base ? `${base}-${suffixe}` : suffixe;
}

export async function getAllOffresAdmin(): Promise<OffreAdmin[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<OffreAdmin>(
    `SELECT url, slug, poste, entite, ville, description, domaine, type_stage,
            duree, source, date_pub_iso, age_jours, fenetre, candidats,
            indemnite, premiere_detection, derniere_verification, masque, manuel
     FROM offres
     ORDER BY premiere_detection DESC`
  );
  return rows;
}

export async function getOffreByUrlAdmin(url: string): Promise<OffreAdmin | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<OffreAdmin>(
    `SELECT url, slug, poste, entite, ville, description, domaine, type_stage,
            duree, source, date_pub_iso, age_jours, fenetre, candidats,
            indemnite, premiere_detection, derniere_verification, masque, manuel
     FROM offres WHERE url = $1`,
    [url]
  );
  return rows[0] ?? null;
}

export type OffreEditable = {
  poste: string;
  entite: string;
  ville: string;
  description: string;
  domaine: string;
  type_stage: string;
  duree: string;
  indemnite: string;
};

export async function updateOffre(url: string, champs: OffreEditable): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query(
    `UPDATE offres SET poste=$2, entite=$3, ville=$4, description=$5,
       domaine=$6, type_stage=$7, duree=$8, indemnite=$9
     WHERE url = $1`,
    [
      url,
      champs.poste,
      champs.entite,
      champs.ville,
      champs.description,
      champs.domaine,
      champs.type_stage,
      champs.duree,
      champs.indemnite,
    ]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function setMasque(url: string, masque: boolean): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query("UPDATE offres SET masque = $2 WHERE url = $1", [url, masque]);
  return (res.rowCount ?? 0) > 0;
}

export async function deleteOffre(url: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query("DELETE FROM offres WHERE url = $1", [url]);
  return (res.rowCount ?? 0) > 0;
}

export type NouvelleOffre = {
  poste: string;
  entite: string;
  ville: string;
  description: string;
  domaine: string;
  type_stage: string;
  duree: string;
  indemnite: string;
};

/** Retourne le slug généré, pour rediriger l'admin vers la fiche créée.
 * source="Manuel" (pas une des sources scrapées) pour distinguer l'origine
 * dans l'affichage, en plus du flag manuel=TRUE (qui, lui, pilote la
 * protection contre la purge du pipeline). */
export async function createManualOffre(o: NouvelleOffre): Promise<string> {
  const pool = getPool();
  if (!pool) throw new Error("Base de données non configurée");
  const url = `manuel:${randomUUID()}`;
  const slug = slugify(url, o.poste);
  const maintenant = new Date();
  await pool.query(
    `INSERT INTO offres (
       url, poste, entite, ville, description, domaine, type_stage, duree,
       source, date_pub_iso, age_jours, fenetre, candidats, slug, indemnite,
       premiere_detection, derniere_verification, manuel
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Manuel',NULL,0,'NOUVEAU',NULL,$9,$10,$11,$11,TRUE)`,
    [
      url,
      o.poste,
      o.entite,
      o.ville,
      o.description,
      o.domaine,
      o.type_stage,
      o.duree,
      slug,
      o.indemnite,
      maintenant,
    ]
  );
  return slug;
}

export type OffresStats = {
  total: number;
  parFenetre: { fenetre: string; n: number }[];
  parDomaine: { domaine: string; n: number }[];
  parSource: { source: string; n: number }[];
  masquees: number;
  manuelles: number;
};

export async function getOffresStats(): Promise<OffresStats | null> {
  const pool = getPool();
  if (!pool) return null;
  const [total, parFenetre, parDomaine, parSource, masquees, manuelles] = await Promise.all([
    pool.query<{ count: string }>("SELECT count(*) FROM offres WHERE masque = FALSE"),
    pool.query<{ fenetre: string; n: string }>(
      "SELECT fenetre, count(*) AS n FROM offres WHERE masque = FALSE GROUP BY fenetre ORDER BY n DESC"
    ),
    pool.query<{ domaine: string; n: string }>(
      "SELECT COALESCE(domaine, 'Autre') AS domaine, count(*) AS n FROM offres WHERE masque = FALSE GROUP BY domaine ORDER BY n DESC"
    ),
    pool.query<{ source: string; n: string }>(
      "SELECT COALESCE(source, 'Inconnue') AS source, count(*) AS n FROM offres WHERE masque = FALSE GROUP BY source ORDER BY n DESC"
    ),
    pool.query<{ count: string }>("SELECT count(*) FROM offres WHERE masque = TRUE"),
    pool.query<{ count: string }>("SELECT count(*) FROM offres WHERE manuel = TRUE"),
  ]);
  return {
    total: Number(total.rows[0]?.count ?? 0),
    parFenetre: parFenetre.rows.map((r) => ({ fenetre: r.fenetre, n: Number(r.n) })),
    parDomaine: parDomaine.rows.map((r) => ({ domaine: r.domaine, n: Number(r.n) })),
    parSource: parSource.rows.map((r) => ({ source: r.source, n: Number(r.n) })),
    masquees: Number(masquees.rows[0]?.count ?? 0),
    manuelles: Number(manuelles.rows[0]?.count ?? 0),
  };
}
