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

/** domainePrefere : null/vide = tous domaines confondus (comportement par
 * défaut, inchangé). Toujours ré-enregistré même sur une adresse déjà
 * confirmée -> permet de changer sa préférence sans repasser par un code. */
export async function subscribe(
  emailRaw: string,
  domainePrefere?: string | null
): Promise<SubscribeResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { status: "invalid_email" };

  const pool = getPool();
  if (!pool) return { status: "db_unavailable" };
  await ensureSchema(pool);

  const domaine =
    domainePrefere && DOMAINES_NEWSLETTER.includes(domainePrefere) ? domainePrefere : null;

  const existing = await pool.query<{ confirme: boolean; actif: boolean }>(
    "SELECT confirme, actif FROM abonnes WHERE email = $1",
    [email]
  );

  const code = genererCode();
  const expire = new Date(Date.now() + CODE_VALIDITE_MIN * 60_000);

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.confirme && row.actif) {
      await pool.query("UPDATE abonnes SET domaine_prefere = $2 WHERE email = $1", [email, domaine]);
      return { status: "already_confirmed" };
    }
    if (row.confirme && !row.actif) {
      // Déjà confirmé mais désabonné entre-temps -> réactive directement
      // (adresse déjà prouvée une fois), pas besoin d'un nouveau code.
      await pool.query(
        "UPDATE abonnes SET actif = TRUE, domaine_prefere = $2 WHERE email = $1",
        [email, domaine]
      );
      return { status: "reactivated" };
    }
    // Jamais confirmé -> nouveau code, tentatives remises à zéro.
    await pool.query(
      `UPDATE abonnes SET actif = TRUE, code = $2, code_expire = $3, tentatives = 0,
              domaine_prefere = $4 WHERE email = $1`,
      [email, code, expire, domaine]
    );
    return { status: "resent", code };
  }

  const token = randomUUID(); // désabonnement uniquement, jamais affiché à l'inscription
  await pool.query(
    "INSERT INTO abonnes (email, token, code, code_expire, domaine_prefere) VALUES ($1, $2, $3, $4, $5)",
    [email, token, code, expire, domaine]
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
    "UPDATE abonnes SET confirme = TRUE, code = NULL, code_expire = NULL WHERE email = $1",
    [email]
  );
  return { status: "ok", dejaConfirme: false, token: row.token };
}

export async function unsubscribe(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query(
    "UPDATE abonnes SET actif = FALSE WHERE token = $1", [token]
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
  domaine_prefere: string | null;
  cree_le: string;
  dernier_envoi: string | null;
};

export async function listerAbonnesAdmin(): Promise<AbonneAdmin[]> {
  const pool = getPool();
  if (!pool) return [];
  await ensureSchema(pool);
  const { rows } = await pool.query<AbonneAdmin>(
    `SELECT id, email, token, confirme, actif, domaine_prefere, cree_le, dernier_envoi
     FROM abonnes ORDER BY cree_le DESC`
  );
  return rows;
}

export type AbonnesStats = {
  confirmesActifs: number;
  enAttente: number;
  desabonnes: number;
  parDomaine: { domaine: string; n: number }[];
};

export async function getAbonnesStats(): Promise<AbonnesStats | null> {
  const pool = getPool();
  if (!pool) return null;
  await ensureSchema(pool);
  const [confirmesActifs, enAttente, desabonnes, parDomaine] = await Promise.all([
    pool.query<{ count: string }>("SELECT count(*) FROM abonnes WHERE confirme = TRUE AND actif = TRUE"),
    pool.query<{ count: string }>("SELECT count(*) FROM abonnes WHERE confirme = FALSE"),
    pool.query<{ count: string }>("SELECT count(*) FROM abonnes WHERE confirme = TRUE AND actif = FALSE"),
    pool.query<{ domaine: string; n: string }>(
      `SELECT COALESCE(domaine_prefere, 'Tous domaines') AS domaine, count(*) AS n
       FROM abonnes WHERE confirme = TRUE AND actif = TRUE
       GROUP BY domaine ORDER BY n DESC`
    ),
  ]);
  return {
    confirmesActifs: Number(confirmesActifs.rows[0]?.count ?? 0),
    enAttente: Number(enAttente.rows[0]?.count ?? 0),
    desabonnes: Number(desabonnes.rows[0]?.count ?? 0),
    parDomaine: parDomaine.rows.map((r) => ({ domaine: r.domaine, n: Number(r.n) })),
  };
}

/** Désabonnement déclenché par l'admin (par id, pas par token -- l'admin
 * n'a pas le token de l'abonné sous la main dans l'interface). */
export async function desabonnerParId(id: number): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query("UPDATE abonnes SET actif = FALSE WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}
