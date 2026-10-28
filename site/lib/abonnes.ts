import { randomUUID } from "crypto";
import type { Pool } from "pg";
import { DOMAINES_NEWSLETTER } from "./newsletter-domaines";
import { getPool } from "./pg";

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS abonnes (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    code TEXT,
    code_expire TIMESTAMPTZ,
    tentatives INTEGER NOT NULL DEFAULT 0,
    confirme BOOLEAN NOT NULL DEFAULT FALSE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    dernier_envoi TIMESTAMPTZ
)`;

// Migrations additives idempotentes : la table peut déjà exister depuis la
// version "confirmation par lien" (colonnes code/code_expire/tentatives
// absentes) — même pattern que db_sync.py côté Python.
const MIGRATIONS_SQL = [
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS code TEXT",
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS code_expire TIMESTAMPTZ",
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS tentatives INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS domaine_prefere TEXT",
  // Plusieurs domaines + une ville (remplacent domaine_prefere, gardé pour
  // les anciennes lignes ; même migration côté newsletter.py).
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS domaines TEXT[]",
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS ville_preferee TEXT",
  `UPDATE abonnes SET domaines = ARRAY[domaine_prefere]
   WHERE domaines IS NULL AND domaine_prefere IS NOT NULL`,
  // Dates pour les statistiques de l'admin (inscriptions / désabonnements
  // par semaine). NULL sur les lignes antérieures : cree_le sert de repli.
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS confirme_le TIMESTAMPTZ",
  "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS desabonne_le TIMESTAMPTZ",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_VALIDITE_MIN = 15;
const MAX_TENTATIVES = 5;

async function ensureSchema(pool: Pool) {
  await pool.query(TABLE_SQL);
  for (const m of MIGRATIONS_SQL) await pool.query(m);
}

function genererCode(): string {
  // 6 chiffres, toujours zero-paddé (ex. "042817").
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export type SubscribeResult =
  | { status: "created"; code: string }
  | { status: "resent"; code: string }
  | { status: "reactivated" }
  | { status: "already_confirmed" }
  | { status: "invalid_email" }
  | { status: "db_unavailable" };

/** domainesChoisis vide = tous domaines ; villeChoisie vide = toutes villes.
 * Toujours ré-enregistrées même sur une adresse déjà confirmée -> permet de
 * changer ses préférences sans repasser par un code. */
export async function subscribe(
  emailRaw: string,
  domainesChoisis?: string[] | null,
  villeChoisie?: string | null
): Promise<SubscribeResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { status: "invalid_email" };

  const pool = getPool();
  if (!pool) return { status: "db_unavailable" };
  await ensureSchema(pool);

  const valides = Array.from(
    new Set((domainesChoisis ?? []).filter((d) => DOMAINES_NEWSLETTER.includes(d)))
  );
  const domaines = valides.length > 0 ? valides : null;
  // Ville acceptée seulement si elle existe parmi les offres (liste du formulaire).
  let ville: string | null = null;
  if (villeChoisie) {
    const r = await pool.query("SELECT 1 FROM offres WHERE ville = $1 LIMIT 1", [villeChoisie]);
    ville = r.rows.length > 0 ? villeChoisie : null;
  }
  const prefs = "domaines = $2, ville_preferee = $3, domaine_prefere = NULL";

  const existing = await pool.query<{ confirme: boolean; actif: boolean }>(
    "SELECT confirme, actif FROM abonnes WHERE email = $1",
    [email]
  );

  const code = genererCode();
  const expire = new Date(Date.now() + CODE_VALIDITE_MIN * 60_000);

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.confirme && row.actif) {
      await pool.query(`UPDATE abonnes SET ${prefs} WHERE email = $1`, [email, domaines, ville]);
      return { status: "already_confirmed" };
    }
    if (row.confirme && !row.actif) {
      // Déjà confirmé mais désabonné entre-temps -> réactive directement
      // (adresse déjà prouvée une fois), pas besoin d'un nouveau code.
      await pool.query(
        `UPDATE abonnes SET actif = TRUE, desabonne_le = NULL, ${prefs} WHERE email = $1`,
        [email, domaines, ville]
      );
      return { status: "reactivated" };
    }
    // Jamais confirmé -> nouveau code, tentatives remises à zéro.
    await pool.query(
      `UPDATE abonnes SET actif = TRUE, code = $4, code_expire = $5, tentatives = 0, ${prefs}
       WHERE email = $1`,
      [email, domaines, ville, code, expire]
    );
    return { status: "resent", code };
  }

  const token = randomUUID(); // désabonnement uniquement, jamais affiché à l'inscription
  await pool.query(
    `INSERT INTO abonnes (email, token, code, code_expire, domaines, ville_preferee)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [email, token, code, expire, domaines, ville]
  );
  return { status: "created", code };
}

export type VerifyResult =
  | { status: "ok"; dejaConfirme: boolean; token: string }
  | { status: "wrong_code" }
  | { status: "expired" }
  | { status: "too_many_attempts" }
  | { status: "not_found" }
  | { status: "db_unavailable" };

export async function verifyOtp(emailRaw: string, codeRaw: string): Promise<VerifyResult> {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim();

  const pool = getPool();
  if (!pool) return { status: "db_unavailable" };
  await ensureSchema(pool);

  const res = await pool.query<{
    code: string | null; code_expire: string | null; tentatives: number; confirme: boolean;
    token: string;
  }>("SELECT code, code_expire, tentatives, confirme, token FROM abonnes WHERE email = $1", [email]);
  if (res.rows.length === 0) return { status: "not_found" };
  const row = res.rows[0];

  // déjà confirmé (double-clic) -> idempotent, ne redéclenche jamais le mail de bienvenue
  if (row.confirme) return { status: "ok", dejaConfirme: true, token: row.token };

  if (row.tentatives >= MAX_TENTATIVES) return { status: "too_many_attempts" };

  if (!row.code || !row.code_expire || new Date(row.code_expire) < new Date()) {
    return { status: "expired" };
  }

  if (row.code !== code) {
    await pool.query("UPDATE abonnes SET tentatives = tentatives + 1 WHERE email = $1", [email]);
    return { status: "wrong_code" };
  }

  await pool.query(
    "UPDATE abonnes SET confirme = TRUE, confirme_le = now(), code = NULL, code_expire = NULL WHERE email = $1",
    [email]
  );
  return { status: "ok", dejaConfirme: false, token: row.token };
}

export async function unsubscribe(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query(
    "UPDATE abonnes SET actif = FALSE, desabonne_le = now() WHERE token = $1 AND actif = TRUE",
    [token]
  );
  return (res.rowCount ?? 0) > 0;
}

// --- Administration (CMS) -------------------------------------------------

export type AbonneAdmin = {
  id: number;
  email: string;
  token: string;
  confirme: boolean;
  actif: boolean;
  domaines: string[] | null;
  ville_preferee: string | null;
  cree_le: string;
  dernier_envoi: string | null;
};

export async function listerAbonnesAdmin(): Promise<AbonneAdmin[]> {
  const pool = getPool();
  if (!pool) return [];
  await ensureSchema(pool);
  const { rows } = await pool.query<AbonneAdmin>(
    `SELECT id, email, token, confirme, actif, domaines, ville_preferee, cree_le, dernier_envoi
     FROM abonnes ORDER BY cree_le DESC`
  );
  return rows;
}

export type AbonnesStats = {
  confirmesActifs: number;
  enAttente: number;
  desabonnes: number;
  parDomaine: { domaine: string; n: number }[];
  parVille: { ville: string; n: number }[];
  /** 8 dernières semaines, de la plus ancienne à la plus récente (lundi ISO). */
  parSemaine: { semaine: string; inscriptions: number; desabonnements: number }[];
};

export async function getAbonnesStats(): Promise<AbonnesStats | null> {
  const pool = getPool();
  if (!pool) return null;
  await ensureSchema(pool);
  const [confirmesActifs, enAttente, desabonnes, parDomaine, parVille, parSemaine] = await Promise.all([
    pool.query<{ count: string }>("SELECT count(*) FROM abonnes WHERE confirme = TRUE AND actif = TRUE"),
    pool.query<{ count: string }>("SELECT count(*) FROM abonnes WHERE confirme = FALSE"),
    pool.query<{ count: string }>("SELECT count(*) FROM abonnes WHERE confirme = TRUE AND actif = FALSE"),
    // Un abonné à 2 domaines compte dans chacun des deux.
    pool.query<{ domaine: string; n: string }>(
      `SELECT COALESCE(d, 'Tous domaines') AS domaine, count(*) AS n
       FROM abonnes LEFT JOIN LATERAL unnest(domaines) AS d ON TRUE
       WHERE confirme = TRUE AND actif = TRUE
       GROUP BY 1 ORDER BY n DESC`
    ),
    pool.query<{ ville: string; n: string }>(
      `SELECT COALESCE(ville_preferee, 'Toutes villes') AS ville, count(*) AS n
       FROM abonnes WHERE confirme = TRUE AND actif = TRUE
       GROUP BY 1 ORDER BY n DESC`
    ),
    pool.query<{ semaine: string; inscriptions: string; desabonnements: string }>(
      `WITH semaines AS (
         SELECT generate_series(date_trunc('week', now()) - interval '7 weeks',
                                date_trunc('week', now()), interval '1 week') AS s
       )
       SELECT to_char(s, 'YYYY-MM-DD') AS semaine,
              (SELECT count(*) FROM abonnes WHERE confirme = TRUE
                 AND date_trunc('week', COALESCE(confirme_le, cree_le)) = s) AS inscriptions,
              (SELECT count(*) FROM abonnes
                 WHERE date_trunc('week', desabonne_le) = s) AS desabonnements
       FROM semaines ORDER BY s`
    ),
  ]);
  return {
    confirmesActifs: Number(confirmesActifs.rows[0]?.count ?? 0),
    enAttente: Number(enAttente.rows[0]?.count ?? 0),
    desabonnes: Number(desabonnes.rows[0]?.count ?? 0),
    parDomaine: parDomaine.rows.map((r) => ({ domaine: r.domaine, n: Number(r.n) })),
    parVille: parVille.rows.map((r) => ({ ville: r.ville, n: Number(r.n) })),
    parSemaine: parSemaine.rows.map((r) => ({
      semaine: r.semaine,
      inscriptions: Number(r.inscriptions),
      desabonnements: Number(r.desabonnements),
    })),
  };
}

/** Désabonnement déclenché par l'admin (par id, pas par token -- l'admin
 * n'a pas le token de l'abonné sous la main dans l'interface). */
export async function desabonnerParId(id: number): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query(
    "UPDATE abonnes SET actif = FALSE, desabonne_le = now() WHERE id = $1",
    [id]
  );
  return (res.rowCount ?? 0) > 0;
}

/** Abonné confirmé et actif (null sinon) : l'admin n'écrit jamais à une
 * adresse non confirmée ou désabonnée. */
export async function getAbonneActifParId(
  id: number
): Promise<{ email: string; token: string } | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<{ email: string; token: string }>(
    "SELECT email, token FROM abonnes WHERE id = $1 AND confirme = TRUE AND actif = TRUE",
    [id]
  );
  return rows[0] ?? null;
}
