# Veille des offres de stage — Maroc (tous domaines)

Pipeline Python de détection des offres de **stage au Maroc**, tous domaines
confondus (informatique, ingénierie, finance, commerce, RH, juridique,
santé...) et tous types de stage (PFE/fin d'études, été/initiation,
alternance). Produit un fichier Excel mis à jour de façon incrémentale.

Projet frère de `sourcing-regie-banque` (même architecture de collecte/cache/
Excel), mais sans filtre métier : ici la seule question posée à chaque
annonce est *« est-ce vraiment un stage, ouvert, basé au Maroc ? »*. Le
domaine détecté (Informatique/Data, Ingénierie, Finance...) est un **tag
informatif**, jamais un critère d'exclusion.

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Aucune clé API requise (pas de filtre de similarité IA en v1 — voir
"Limites" ci-dessous).

## Usage

```bash
python stages_maroc.py            # collecte complète (réseau) + Excel
python stages_maroc.py reclass    # re-classe depuis le cache local, sans réseau
```

Réglages via variables d'environnement (facultatif) :

| Variable | Défaut | Rôle |
|---|---|---|
| `STG_PAGES` | 2 | pages LinkedIn par requête (10 offres/page) |
| `STG_MAX_DETAIL` | 250 | plafond de fiches LinkedIn lues en détail |
| `STG_QUERY_LIMIT` | 0 (toutes) | limite le nombre de requêtes LinkedIn |
| `STG_FRESH_DAYS` | 7 | fenêtre de la passe "fraîcheur" (0 = désactivée) |
| `STG_SIMILAR_SEEDS` | 20 | graines pour la passe "offres similaires" (0 = off) |
| `STG_OUT` | (vide) | écrit dans un fichier séparé au lieu du fichier de travail (relecture) |

## Sources

| Source | Accès | Remarque |
|---|---|---|
| **LinkedIn** | endpoint public `jobs-guest` (sans connexion) | n'utilise pas votre compte ; mécanique portée depuis `sourcing-regie-banque` |
| **Rekrute.com** | scraping best-effort (pas d'API publique) | référence du marché marocain ; `robots.txt` vérifié — pas de blocage générique, seuls les gros crawlers nommés (Googlebot, GPTBot...) sont restreints sur les pages de résultats |

Pour ajouter une source : écrire un collecteur dans `sources.py` (même
contrat que `collect_rekrute` — liste de dicts avec les mêmes clés que les
annonces LinkedIn) et l'ajouter au registre `COLLECTORS`.

## Comment une offre devient « convenable »

Logique dans `classifier.py` (pure, testée, `test_classifier.py`). Une
annonce est **convenable** si :
1. **C'est un stage** — détecté par mots-clés dans le titre (haute
   précision) ou déclaration explicite du type de contrat dans le texte
   (« offre de stage », « convention de stage », « poste en alternance »...).
   Garde-fou : une mention isolée du mot « stage » sur un poste
   manifestement senior/CDI (« profil senior », « 5 ans d'expérience
   minimum »...) ne suffit pas.
2. **C'est au Maroc** — exclut les villes/pays clairement étrangers
   (France incluse, contrairement à `sourcing-regie-banque` où elle était
   dans le périmètre).
3. **Pas fermée** (si l'information est disponible).

Le **type de stage** (PFE / Alternance / Été-initiation / Non précisé) et le
**domaine** (Informatique/Data, Ingénierie, Finance, Commerce, RH,
Juridique, Santé, Autre) sont posés en tags informatifs — aucun des deux
n'exclut une offre, conformément au choix "tous domaines, tous types".

La **fraîcheur** (colonne "fenêtre") suit la même logique que
`sourcing-regie-banque` : NOUVEAU (≤7j) · OUVERTE (≤21j) · ROUVERTE
(republiée) · VIVIER (source à annonces actives, ≤90j) · AGÉE (au-delà, sans
signal de fraîcheur) · INCONNUE (date introuvable).

## Sortie

`Stages_Maroc.xlsx` — un seul onglet "Stages Maroc". Colonnes : poste,
entreprise, ville, description, domaine, type de stage, durée, SOURCE (lien
cliquable), publication, candidats, âge (j), fenêtre, 1re détection, dern.
vérif., provenance.

Mise à jour **incrémentale** : une ligne déjà présente n'est jamais réécrite
(vos surlignages/notes/suppressions manuelles sont conservés) ; seules les
nouvelles offres convenables sont ajoutées à la suite, marquées ★. Les
offres écartées restent tracées dans `annonces_vues.json` (jamais perdues,
juste non affichées).

## Site web (`site/`)

Application Next.js (App Router, Tailwind) qui affiche les offres
convenables en direct — filtres par domaine, type de stage, ville,
recherche texte. Elle ne lit jamais l'Excel : elle interroge une base
**Postgres (Supabase)** alimentée par `db_sync.py` à chaque run du pipeline.

```bash
cd site
npm install
cp .env.local.example .env.local   # renseigner DATABASE_URL (Supabase)
npm run dev
```

Hébergement prévu : **Vercel**, avec *Root Directory* = `site`.

## Base de données (Supabase)

`db_sync.py` synchronise les offres convenables vers une table Postgres
(`offres`) à chaque exécution de `stages_maroc.py` : upsert par URL,
suppression des offres qui ne sont plus convenables. `premiere_detection`
n'est jamais réécrite après l'insertion initiale (même logique que
`annonces_vues.json`).

Dégrade proprement : si `psycopg2` n'est pas installé ou si `DATABASE_URL`
n'est pas définie, la synchro est simplement ignorée (message affiché) — un
run local sans base configurée continue de fonctionner normalement (Excel
inchangé).

Mise en route :
1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Récupérer la chaîne de connexion (Settings → Database → Connection
   string) :
   - **Site (Vercel)** : utiliser le *connection pooler* (Transaction mode,
     port 6543) — un environnement serverless ouvre beaucoup de connexions
     courtes, le pooler évite de saturer Postgres. Voir Settings → Database
     → Connection pooling.
   - **Pipeline (local ou GitHub Actions)** : la connexion directe (port
     5432) suffit — un run séquentiel unique, pas de concurrence.
3. `DATABASE_URL` à renseigner : en local dans `.env` (racine, pour Python)
   et `site/.env.local` (pour Next.js) ; sur Vercel dans les variables
   d'environnement du projet ; sur GitHub Actions dans Settings → Secrets
   and variables → Actions (utilisé par `.github/workflows/scrape.yml`).

## Automatisation cloud (`.github/workflows/scrape.yml`)

Exécute `python stages_maroc.py` sur GitHub Actions (déclenchement manuel
actif dès maintenant, `cron` quotidien désactivé par défaut tant que le
secret `DATABASE_URL` n'est pas configuré — cf. commentaires dans le
fichier). Le cache de scraping (`cache_stages_maroc.json`) est conservé
entre les runs via `actions/cache`, pour ne pas re-télécharger toutes les
fiches LinkedIn à chaque exécution.

## Tests

```bash
python -m unittest test_classifier
```

## Limites connues / hors scope v1

- **Pas de filtre de similarité IA** (contrairement à `sourcing-regie-banque`
  qui compare chaque offre à un profil idéal via Gemini) : sans domaine
  restreint, un profil idéal unique n'aurait pas de sens ici. Pourrait être
  ajouté plus tard si un tri personnalisé (ex. contre un CV) est souhaité.
- **Rekrute.com est scrapé, pas d'API publique** : structure HTML non
  documentée officiellement, best-effort — peut se dégrader si le site
  change de gabarit, sans faire planter le run (cf. `sources.collect_all`).
  Le "Type de contrat" affiché par Rekrute est souvent absent/commenté en
  HTML : le tri "est-ce vraiment un stage" repose donc sur le classifieur
  (titre + texte), pas sur ce champ.
- **Autres sources marocaines non intégrées** (ANAPEC, MarocAnnonces,
  Indeed Maroc...) — structure non vérifiée à ce jour, ajoutables via le
  registre `COLLECTORS` de `sources.py`.
