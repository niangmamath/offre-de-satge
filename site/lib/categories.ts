import { cache } from "react";
import { getPool } from "./pg";
import type { Offre } from "./db";
import { slugifyLibre } from "./slug";

// React cache() memoise par requete : pendant `next build` les 30+ pages
// statiques (villes, domaines, entreprises) partagent une seule execution
// de chaque lookup, sinon on faisait 150-200 queries sur Neon et le worker
// Vercel timeout au bout de 60s. En runtime c'est la meme chose : une seule
// requete par requete HTTP, meme si la page et le sitemap appellent tous
// les deux getVillesAvecCompte().

// Helpers de regroupement pour les pages de categorie SEO (ville, domaine,
// entreprise, campagne PFE). Toutes filtrent masque=FALSE, comme getOffres(),
// pour que ce qu'un admin masque n'apparaisse nulle part.

const SELECT_OFFRE = `
  SELECT url, slug, poste, entite, ville, description, domaine, type_stage,
         duree, source, date_pub_iso, age_jours, fenetre, candidats,
         indemnite, premiere_detection, derniere_verification
  FROM offres
  WHERE masque = FALSE
`;

// --- Villes ---------------------------------------------------------------

export const getVillesAvecCompte = cache(async (): Promise<{ ville: string; slug: string; n: number }[]> => {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<{ ville: string; n: string }>(
    `SELECT ville, count(*) AS n FROM offres
     WHERE masque = FALSE AND ville IS NOT NULL AND ville <> ''
     GROUP BY ville HAVING count(*) >= 1
     ORDER BY n DESC, ville ASC`
  );
  return rows.map((r) => ({ ville: r.ville, slug: slugifyLibre(r.ville), n: Number(r.n) }));
});

export async function getOffresParVille(ville: string): Promise<Offre[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<Offre>(
    `${SELECT_OFFRE} AND ville ILIKE $1
     ORDER BY date_pub_iso DESC NULLS LAST, premiere_detection DESC`,
    [ville]
  );
  return rows;
}

// --- Domaines -------------------------------------------------------------

export const getDomainesAvecCompte = cache(async (): Promise<{ domaine: string; slug: string; n: number }[]> => {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<{ domaine: string; n: string }>(
    `SELECT domaine, count(*) AS n FROM offres
     WHERE masque = FALSE AND domaine IS NOT NULL AND domaine <> ''
     GROUP BY domaine HAVING count(*) >= 1
     ORDER BY n DESC, domaine ASC`
  );
  return rows.map((r) => ({ domaine: r.domaine, slug: slugifyLibre(r.domaine), n: Number(r.n) }));
});

export async function getOffresParDomaine(domaine: string): Promise<Offre[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<Offre>(
    `${SELECT_OFFRE} AND domaine = $1
     ORDER BY date_pub_iso DESC NULLS LAST, premiere_detection DESC`,
    [domaine]
  );
  return rows;
}

// --- Entreprises ----------------------------------------------------------
// Seules les entreprises qui ont >=2 offres meritent une page (sinon la page
// entreprise ferait doublon avec la fiche unique, Google penalise ce type
// de thin content).

export const getEntitesAvecCompte = cache(async (seuil = 2): Promise<{ entite: string; slug: string; n: number }[]> => {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<{ entite: string; n: string }>(
    `SELECT entite, count(*) AS n FROM offres
     WHERE masque = FALSE AND entite IS NOT NULL AND entite <> ''
     GROUP BY entite HAVING count(*) >= $1
     ORDER BY n DESC, entite ASC`,
    [seuil]
  );
  return rows.map((r) => ({ entite: r.entite, slug: slugifyLibre(r.entite), n: Number(r.n) }));
});

export async function getEntiteParSlug(slug: string): Promise<string | null> {
  const toutes = await getEntitesAvecCompte(1);
  return toutes.find((e) => e.slug === slug)?.entite ?? null;
}

export async function getOffresParEntite(entite: string): Promise<Offre[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<Offre>(
    `${SELECT_OFFRE} AND entite = $1
     ORDER BY date_pub_iso DESC NULLS LAST, premiere_detection DESC`,
    [entite]
  );
  return rows;
}

// --- Campagne PFE 2027 ----------------------------------------------------
// Match sur le poste ou la description. Le pipeline renseigne type_stage='PFE'
// pour la plupart, mais pas tous : on elargit pour ne rien rater. L'annee est
// cherchee a la fois comme '2027' et '26-2027'/'2026-2027' (annee universitaire).

export async function getOffresPFE2027(): Promise<Offre[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query<Offre>(
    `${SELECT_OFFRE}
     AND (type_stage ILIKE '%PFE%' OR poste ILIKE '%PFE%' OR description ILIKE '%PFE%')
     AND (poste ILIKE '%2027%' OR description ILIKE '%2027%'
          OR poste ILIKE '%2026-27%' OR description ILIKE '%2026-27%'
          OR poste ILIKE '%2026/2027%' OR description ILIKE '%2026/2027%')
     ORDER BY date_pub_iso DESC NULLS LAST, premiere_detection DESC`
  );
  return rows;
}
