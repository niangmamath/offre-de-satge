import type { Pool } from "pg";
import { getPool } from "./pg";

// Messages du formulaire /contact : gardés en base en plus du mail envoyé à
// l'admin -- si l'envoi SMTP tombe en panne (mot de passe Gmail révoqué en
// 09/2026, passé inaperçu deux semaines), rien n'est perdu.
const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages_contact (
    id SERIAL PRIMARY KEY,
    nom TEXT,
    email TEXT NOT NULL,
    sujet TEXT NOT NULL,
    message TEXT NOT NULL,
    mail_envoye BOOLEAN NOT NULL DEFAULT FALSE,
    traite BOOLEAN NOT NULL DEFAULT FALSE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

async function ensureSchema(pool: Pool) {
  await pool.query(TABLE_SQL);
}

/** id du message, ou null si la base est indisponible (l'appelant tente
 * quand même l'envoi par mail). */
export async function enregistrerMessage(m: {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}): Promise<number | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    await ensureSchema(pool);
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO messages_contact (nom, email, sujet, message)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [m.nom || null, m.email, m.sujet, m.message]
    );
    return rows[0]?.id ?? null;
  } catch (e) {
    console.error("[messages] échec enregistrement:", e);
    return null;
  }
}

export async function marquerMailEnvoye(id: number): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE messages_contact SET mail_envoye = TRUE WHERE id = $1", [id]);
}

export type MessageContact = {
  id: number;
  nom: string | null;
  email: string;
  sujet: string;
  message: string;
  mail_envoye: boolean;
  traite: boolean;
  cree_le: string;
};

export async function listerMessages(): Promise<MessageContact[]> {
  const pool = getPool();
  if (!pool) return [];
  await ensureSchema(pool);
  const { rows } = await pool.query<MessageContact>(
    `SELECT id, nom, email, sujet, message, mail_envoye, traite, cree_le
     FROM messages_contact ORDER BY traite ASC, cree_le DESC`
  );
  return rows;
}

export async function compterMessagesNonTraites(): Promise<number | null> {
  const pool = getPool();
  if (!pool) return null;
  await ensureSchema(pool);
  const { rows } = await pool.query<{ count: string }>(
    "SELECT count(*) FROM messages_contact WHERE traite = FALSE"
  );
  return Number(rows[0]?.count ?? 0);
}

export async function marquerTraite(id: number, traite: boolean): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query("UPDATE messages_contact SET traite = $2 WHERE id = $1", [id, traite]);
  return (res.rowCount ?? 0) > 0;
}
