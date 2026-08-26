# -*- coding: utf-8 -*-
"""Synchronisation des offres CONVENABLES vers une base Postgres, pour
alimenter le site web (Next.js/Vercel) en direct.

Dégrade proprement : si `psycopg2` n'est pas installé ou si `DATABASE_URL`
n'est pas définie, `sync()` affiche un message et ne fait rien — un run
local sans base de données configurée reste possible (même philosophie que
`similarite.py`/Playwright dans sourcing-regie-banque).

Contrat : le SITE lit cette table en lecture seule, il n'y a pas de
modification manuelle à préserver (contrairement à l'Excel) — chaque run
REMPLACE l'état "offres actuellement convenables" : upsert de ce qui l'est
encore, suppression de ce qui ne l'est plus.
"""
import datetime as dt
import hashlib
import re
import unicodedata

TABLE_SQL = """
CREATE TABLE IF NOT EXISTS offres (
    url TEXT PRIMARY KEY,
    poste TEXT NOT NULL,
    entite TEXT,
    ville TEXT,
    description TEXT,
    domaine TEXT,
    type_stage TEXT,
    duree TEXT,
    source TEXT,
    date_pub_iso TEXT,
    age_jours INTEGER,
    fenetre TEXT,
    candidats INTEGER,
    premiere_detection TIMESTAMPTZ NOT NULL DEFAULT now(),
    derniere_verification TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""

# ALTER ... ADD COLUMN IF NOT EXISTS : migration additive idempotente, sans
# outil de migration séparé (inutile à cette échelle) — sûr à rejouer à
# chaque run, y compris sur une table déjà peuplée par une version
# antérieure du schéma (cf. colonne "slug", ajoutée après le premier
# déploiement pour les pages de détail par offre).
MIGRATIONS_SQL = [
    "ALTER TABLE offres ADD COLUMN IF NOT EXISTS slug TEXT",
    "CREATE UNIQUE INDEX IF NOT EXISTS offres_slug_idx ON offres (slug)",
    "ALTER TABLE offres ADD COLUMN IF NOT EXISTS indemnite TEXT",
]

UPSERT_SQL = """
INSERT INTO offres (
    url, poste, entite, ville, description, domaine, type_stage, duree,
    source, date_pub_iso, age_jours, fenetre, candidats, slug, indemnite,
    premiere_detection, derniere_verification
) VALUES (
    %(url)s, %(poste)s, %(entite)s, %(ville)s, %(description)s, %(domaine)s,
    %(type_stage)s, %(duree)s, %(source)s, %(date_pub_iso)s, %(age_jours)s,
    %(fenetre)s, %(candidats)s, %(slug)s, %(indemnite)s,
    %(premiere_detection)s, %(derniere_verification)s
)
ON CONFLICT (url) DO UPDATE SET
    poste = EXCLUDED.poste, entite = EXCLUDED.entite, ville = EXCLUDED.ville,
    description = EXCLUDED.description, domaine = EXCLUDED.domaine,
    type_stage = EXCLUDED.type_stage, duree = EXCLUDED.duree,
    source = EXCLUDED.source, date_pub_iso = EXCLUDED.date_pub_iso,
    age_jours = EXCLUDED.age_jours, fenetre = EXCLUDED.fenetre,
    candidats = EXCLUDED.candidats, indemnite = EXCLUDED.indemnite,
    derniere_verification = EXCLUDED.derniere_verification
    -- premiere_detection ET slug volontairement absents de la clause
    -- UPDATE : premiere_detection ne doit jamais être réécrit après
    -- l'insertion initiale (même logique que annonces_vues.json) ; le slug
    -- (dérivé de l'URL, stable par construction) n'a pas de raison de
    -- changer une fois posé, et ne JAMAIS le changer garantit qu'un lien
    -- déjà partagé (mail, réseaux sociaux) reste valide.
"""


def _slug(url, poste):
    """Identifiant d'URL stable et lisible pour la page de détail d'une
    offre : titre translittéré + suffixe déterministe (hash de l'URL
    source) pour l'unicité. Ne dépend QUE de l'URL source -> stable d'un
    run à l'autre même si le titre est légèrement reformulé entre-temps."""
    base = unicodedata.normalize("NFKD", poste or "")
    base = "".join(c for c in base if not unicodedata.combining(c))
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()[:60]
    suffixe = hashlib.sha1((url or "").encode("utf-8")).hexdigest()[:8]
    return f"{base}-{suffixe}" if base else suffixe


def _row(a):
    prem = a.get("premiere_detection")
    deriv = a.get("derniere_verification")
    return {
        "url": a["url"],
        "poste": a.get("poste", ""),
        "entite": a.get("entite", ""),
        "ville": a.get("ville", ""),
        "description": a.get("mission", ""),
        "domaine": a.get("domaine", "Autre"),
        "type_stage": a.get("type_stage", "Non précisé"),
        "duree": a.get("duree", ""),
        "source": a.get("source", ""),
        "date_pub_iso": a.get("date_pub_iso"),
        "age_jours": a.get("age_jours"),
        "fenetre": a.get("fenetre", "INCONNUE"),
        "candidats": a.get("nb_candidats_int"),
        "slug": _slug(a["url"], a.get("poste", "")),
        "indemnite": a.get("indemnite") or "",
        # Les dates d'affichage (dd/mm/YYYY HH:MM, cf. process()) sont
        # reparsées en datetime pour la colonne TIMESTAMPTZ ; à défaut on
        # retombe sur "maintenant" plutôt que de planter tout le run.
        "premiere_detection": _parse_disp(prem),
        "derniere_verification": _parse_disp(deriv),
    }


def _parse_disp(s):
    try:
        return dt.datetime.strptime(s, "%d/%m/%Y %H:%M")
    except Exception:
        return dt.datetime.now()


def sync(items, is_convenable, database_url=None):
    """items : annonces classées (sortie de process()). is_convenable :
    même prédicat que celui utilisé pour l'Excel. database_url : connection
    string Postgres ; si None, lit DATABASE_URL dans l'environnement."""
    import os
    database_url = database_url or os.environ.get("DATABASE_URL")
    if not database_url:
        print("  [db] DATABASE_URL non définie — synchro base ignorée "
              "(le run local/Excel continue normalement).")
        return

    try:
        import psycopg2
    except ImportError:
        print("  [db] psycopg2 non installé (pip install psycopg2-binary) "
              "— synchro base ignorée.")
        return

    convenables = [a for a in items if is_convenable(a)]
    urls_gardees = {a["url"] for a in convenables}

    try:
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                cur.execute(TABLE_SQL)
                for migration in MIGRATIONS_SQL:
                    cur.execute(migration)
                for a in convenables:
                    cur.execute(UPSERT_SQL, _row(a))
                if urls_gardees:
                    cur.execute(
                        "DELETE FROM offres WHERE url != ALL(%s)",
                        (list(urls_gardees),))
                else:
                    cur.execute("DELETE FROM offres")
                supprimees = cur.rowcount
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        print(f"  [db] ERREUR synchro base : {e} — le run local/Excel "
              f"n'est pas affecté.")
        return

    print(f"  [db] {len(convenables)} offre(s) synchronisée(s) "
          f"({supprimees} retirée(s) car plus convenable(s)).")
