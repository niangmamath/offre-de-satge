import { randomUUID } from "crypto";
import { Pool } from "pg";
import { cookies } from "next/headers";

// Pool séparé de lib/db.ts / lib/abonnes.ts -- même raison que ces deux
// derniers (isoler les chemins d'écriture peu fréquents des lectures à fort
// trafic du site public).
const globalForPg = globalThis as unknown as { _pgPoolAdmin?: Pool };

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!globalForPg._pgPoolAdmin) {
    const local = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    globalForPg._pgPoolAdmin = new Pool({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 2,
    });
  }
  return globalForPg._pgPoolAdmin;
}

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

const COOKIE_NAME = "admin_session";
const SESSION_DUREE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

async function ensureSchema(pool: Pool) {
  await pool.query(TABLE_SQL);
}

/** Comparaison en temps constant -- évite qu'un timing attack sur la
 * comparaison de chaînes révèle le mot de passe caractère par caractère
 * (précaution standard, même si le risque réel est faible ici). */
function motDePasseValide(saisi: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD || "";
  if (!attendu || saisi.length !== attendu.length) return false;
  let diff = 0;
  for (let i = 0; i < attendu.length; i++) {
    diff |= saisi.charCodeAt(i) ^ attendu.charCodeAt(i);
  }
  return diff === 0;
}

export type LoginResult = { ok: true; token: string; expiresAt: Date } | { ok: false; erreur: string };

export async function login(motDePasse: string): Promise<LoginResult> {
  if (!process.env.ADMIN_PASSWORD) {
    return { ok: false, erreur: "ADMIN_PASSWORD non configuré côté serveur." };
  }
  if (!motDePasseValide(motDePasse)) {
    return { ok: false, erreur: "Mot de passe incorrect." };
  }
  const pool = getPool();
  if (!pool) return { ok: false, erreur: "Base de données indisponible." };
  await ensureSchema(pool);

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DUREE_MS);
  await pool.query("INSERT INTO admin_sessions (token, expires_at) VALUES ($1, $2)", [token, expiresAt]);
  return { ok: true, token, expiresAt };
}

export async function logout(token: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("DELETE FROM admin_sessions WHERE token = $1", [token]);
}

/** true si le cookie de session présent sur la requête courante correspond
 * à une session valide (non expirée) en base. */
export async function estAuthentifie(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const pool = getPool();
  if (!pool) return false;
  await ensureSchema(pool);
  const res = await pool.query("SELECT 1 FROM admin_sessions WHERE token = $1 AND expires_at > now()", [
    token,
  ]);
  return (res.rowCount ?? 0) > 0;
}

export { COOKIE_NAME, SESSION_DUREE_MS };
