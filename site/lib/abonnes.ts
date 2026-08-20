import { randomUUID } from "crypto";
import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPoolAbonnes?: Pool };

// Pool séparé de celui de lib/db.ts (offres, lecture seule, beaucoup de
// trafic) : l'inscription est un chemin d'écriture, peu fréquent — les
// isoler évite qu'un pic sur l'un affecte les connexions de l'autre.
function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!globalForPg._pgPoolAbonnes) {
    const local = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    globalForPg._pgPoolAbonnes = new Pool({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 2,
    });
  }
  return globalForPg._pgPoolAbonnes;
}

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS abonnes (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    confirme BOOLEAN NOT NULL DEFAULT FALSE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    dernier_envoi TIMESTAMPTZ
)`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult =
  | { status: "created"; token: string }
  | { status: "resent"; token: string }
  | { status: "reactivated" }
  | { status: "already_confirmed" }
  | { status: "invalid_email" }
  | { status: "db_unavailable" };

export async function subscribe(emailRaw: string): Promise<SubscribeResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { status: "invalid_email" };

  const pool = getPool();
  if (!pool) return { status: "db_unavailable" };

  await pool.query(TABLE_SQL);

  const existing = await pool.query<{ token: string; confirme: boolean; actif: boolean }>(
    "SELECT token, confirme, actif FROM abonnes WHERE email = $1",
    [email]
  );
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.confirme && row.actif) return { status: "already_confirmed" };
    if (row.confirme && !row.actif) {
      // Déjà confirmé mais désabonné entre-temps -> réactive sans repasser
      // par un nouveau mail de confirmation (déjà prouvé une fois que
      // l'adresse lui appartient).
      await pool.query("UPDATE abonnes SET actif = TRUE WHERE email = $1", [email]);
      return { status: "reactivated" };
    }
    // Jamais confirmé -> on relance avec le MÊME token (idempotent, pas de
    // fuite de tokens multiples pour une même adresse en cas de double clic).
    await pool.query("UPDATE abonnes SET actif = TRUE WHERE email = $1", [email]);
    return { status: "resent", token: row.token };
  }

  const token = randomUUID();
  await pool.query(
    "INSERT INTO abonnes (email, token) VALUES ($1, $2)",
    [email, token]
  );
  return { status: "created", token };
}

export async function confirm(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query(
    "UPDATE abonnes SET confirme = TRUE WHERE token = $1", [token]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function unsubscribe(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query(
    "UPDATE abonnes SET actif = FALSE WHERE token = $1", [token]
  );
  return (res.rowCount ?? 0) > 0;
}
