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
| **Stagiaires.ma** | scraping via sitemap officiel (pas d'API publique) | plateforme dédiée stages + premiers emplois ; `robots.txt` vérifié — découverte uniquement via leur sitemap (`/offre-sitemap.xml`, jamais d'URL avec `?`, interdite par leur robots.txt), `Crawl-delay: 1` respecté. Pages avec JSON-LD `JobPosting` structuré (titre, entreprise, ville, dates, `employmentType`, indemnité) — extraction fiable, pas de parsing HTML fragile. Liste aussi de vrais emplois (`FULL_TIME`) en plus des stages : filtrés normalement par `classifier.detect_stage()`. |

Sources évaluées et écartées : **Emploi.ma** (`robots.txt` bloque explicitement
ClaudeBot et les principaux crawlers IA — respecté, pas de contournement),
**Stage.ma** (robots.txt interdit toute URL avec paramètre de requête,
utilisées par leur recherche), **OptionCarriere.ma** (robots.txt interdit
précisément les pages de détail d'offre), **ANAPEC** (certificat SSL du
site invalide côté serveur).

Pour ajouter une source : écrire un collecteur dans `sources.py` (même
contrat que `collect_rekrute` — liste de dicts avec les mêmes clés que les
annonces LinkedIn) et l'ajouter au registre `COLLECTORS`.

**Déduplication inter-sources** : `classifier.dedup_annonces()` fusionne les
annonces identiques repérées par plusieurs sources (clé : entreprise + titre
normalisés, insensible aux accents/casse) avant classification, pour éviter
qu'une même offre postée sur LinkedIn et relayée sur Rekrute/Stagiaires.ma
n'apparaisse deux fois sur le site.

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
recherche texte, tri (fraîcheur / date) et pagination (30 offres par page,
bouton "Voir plus"). Elle ne lit jamais l'Excel : elle interroge une base
**Postgres (Supabase)** alimentée par `db_sync.py` à chaque run du pipeline.

Chaque offre a sa propre page de détail (`/offre/[slug]`) avec les données
structurées `schema.org/JobPosting` (référencement Google for Jobs), un
badge indemnité quand la source la précise (actuellement Stagiaires.ma via
JSON-LD `baseSalary`), et un bouton de partage (`navigator.share()` sur
mobile, copie du lien en repli sur desktop).

**Référencement (Google Search Console)** : `app/sitemap.ts` et
`app/robots.ts` exposent déjà `/sitemap.xml` et `/robots.txt` — c'est tout
ce qui peut être préparé côté code. La soumission elle-même (propriété du
site, vérification de propriété, dépôt du sitemap) se fait uniquement
depuis le compte Google du propriétaire du domaine, sur
[search.google.com/search-console](https://search.google.com/search-console) : ajouter la propriété avec l'URL
Vercel, vérifier (méthode "balise HTML" ou "enregistrement DNS" si domaine
personnalisé), puis soumettre `https://<domaine>/sitemap.xml` dans
Sitemaps. Aucune action possible depuis le dépôt de code pour cette étape.

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

Exécute `python stages_maroc.py` sur GitHub Actions. **Déclenché par Vercel
Cron** (`site/vercel.json` → `/api/cron/scrape`, 06:00 UTC), pas par le
`schedule` natif de GitHub Actions : ce dernier s'est révélé peu fiable en
pratique (retards de plusieurs heures, runs sautés lors d'incidents sur la
plateforme GitHub fin août 2026) — GitHub documente lui-même ce
déclencheur comme "best-effort", sans garantie d'horaire. Vercel Cron
appelle l'API GitHub (`workflow_dispatch`) à l'heure prévue ; le travail
long (jusqu'à ~2h) continue de tourner sur GitHub Actions, hors des limites
de durée des fonctions serverless Vercel. Déclenchement manuel toujours
possible (`workflow_dispatch`, bouton dans `/admin` ou `gh workflow run`).
Le cache de scraping (`cache_stages_maroc.json`) est conservé entre les
runs via `actions/cache`, pour ne pas re-télécharger toutes les fiches
LinkedIn à chaque exécution.

Nécessite `GITHUB_TOKEN` et `CRON_SECRET` en variables d'environnement
Vercel (voir section Administration ci-dessous) — sans eux, Vercel Cron
appelle bien la route à l'heure dite mais celle-ci refuse de déclencher
le workflow.

**Alerte en cas d'échec** : si le run échoue (`if: failure()`), un email est
envoyé automatiquement via `notifier.py` (mêmes secrets SMTP que la
newsletter, aucune configuration supplémentaire) avec un lien direct vers
les logs du run — plus besoin d'aller vérifier GitHub Actions manuellement.
Même mécanisme sur `.github/workflows/newsletter.yml`. Si les secrets SMTP
sont absents, `notifier.py` dégrade proprement (log, pas de plantage) au
lieu de faire échouer le step d'alerte lui-même.

## Newsletter (`newsletter.py` + `.github/workflows/newsletter.yml`)

Digest par email chaque semaine pour les visiteurs inscrits sur le site,
listant les offres détectées depuis le dernier envoi (jamais de mail vide
"rien de neuf"). À l'inscription, l'abonné peut choisir un **domaine de
préférence** (Informatique/Data, Finance, RH...) parmi la même taxonomie que
le classifieur ; le digest est alors filtré sur ce domaine au lieu d'envoyer
toutes les offres. Un abonné par groupe de préférence reçoit un seul email
par envoi — le calcul des offres à inclure n'est fait qu'une fois par
groupe, pas par abonné. Double opt-in par **code à 6 chiffres** (pas un lien
magique — un lien cliqué depuis un client mail peut être bloqué par une
protection d'accès ou invalidé par un scanner anti-spam qui le "clique"
avant l'utilisateur ; un code saisi sur une page déjà chargée n'a pas ce
problème), valable 15 min, verrouillé après 5 tentatives incorrectes. Lien
de désabonnement classique dans chaque envoi — obligatoire pour la
délivrabilité et le respect des abonnés.

Envoi par **SMTP direct** (pas de service tiers) — même pattern que
`sourcing-regie-banque/send_mail.py` : `smtplib` + STARTTLS côté digest
périodique (Python/GitHub Actions), `nodemailer` côté confirmation
d'inscription instantanée (Next.js/Vercel, `site/lib/mailer.ts`). Compte
Gmail/Google Workspace recommandé avec un **mot de passe d'application**
(jamais le mot de passe du compte) — myaccount.google.com/apppasswords,
nécessite la validation en 2 étapes activée au préalable.

Variables à renseigner aux **deux endroits** (mêmes valeurs) :

| Variable | Où | Rôle |
|---|---|---|
| `SMTP_SERVER` | Vercel + secret GitHub Actions | `smtp.gmail.com` |
| `SMTP_PORT` | Vercel + secret GitHub Actions | `587` |
| `SMTP_USER` | Vercel + secret GitHub Actions | adresse Gmail d'envoi |
| `SMTP_PASS` | Vercel + secret GitHub Actions | mot de passe d'application |
| `FROM_EMAIL` | Vercel + secret GitHub Actions | adresse affichée comme expéditeur |
| `SITE_URL` | secret GitHub Actions uniquement | URL réelle du site déployé (liens absolus dans le digest) |

Déclenché chaque lundi 08:00 UTC par **Vercel Cron** (`/api/cron/newsletter`),
même raison que `scrape.yml` (voir section Automatisation cloud ci-dessus).
Option `dry_run` disponible sur *Run workflow* (`gh workflow run
newsletter.yml -f dry_run=true`) pour tester sans envoyer aucun email.

## Administration (`site/app/admin`)

Interface `/admin` (mot de passe unique, variable `ADMIN_PASSWORD` côté
Vercel) pour gérer le site sans toucher à la base à la main :

- **Offres** (`/admin/offres`) : masquer/afficher, supprimer, modifier les
  champs descriptifs, ou ajouter une offre manuellement (jamais touchée par
  le scraping automatique). Les modifications sur une offre *scrapée*
  peuvent être écrasées au prochain passage si elle est toujours active sur
  sa source — seuls "Masquer" et "Supprimer" sont garantis durables.
- **Abonnés** (`/admin/abonnes`) : liste des inscrits, statut, désabonnement
  manuel.
- **Tableau de bord** (`/admin`) : compteurs par fraîcheur/domaine/source,
  statistiques d'abonnés, et deux boutons de déclenchement manuel (scraping,
  newsletter) qui appellent l'API GitHub Actions `workflow_dispatch` via
  `site/lib/github-dispatch.ts` — la même fonction qu'utilisent
  `/api/cron/scrape` et `/api/cron/newsletter` (Vercel Cron, cf. section
  Automatisation cloud). Nécessite `GITHUB_TOKEN` (personal access token
  *fine-grained*, limité à ce seul dépôt, permission "Actions: Read and
  write" uniquement) — **obligatoire**, pas seulement pour ce bouton mais
  aussi pour que le déclenchement automatique quotidien/hebdomadaire
  fonctionne. `CRON_SECRET` (chaîne aléatoire d'au moins 16 caractères)
  protège les routes `/api/cron/*` : Vercel l'envoie automatiquement en
  en-tête `Authorization` à l'heure programmée, personne d'autre ne peut
  déclencher ces routes sans le connaître.

Authentification par cookie de session signé (table `admin_sessions`,
créée automatiquement au premier login), pas de compte multi-utilisateur —
suffisant pour un site géré par une seule personne.

**Colonnes `offres.masque` et `offres.manuel`** : additives, gérées
UNIQUEMENT par le site (absentes du `UPSERT_SQL` de `db_sync.py`) pour ne
jamais être écrasées par un run de scraping ; `manuel = TRUE` protège en
plus la ligne de la purge automatique (`sync()` ne supprime jamais une
offre ajoutée à la main). Si ces colonnes n'existent pas encore sur la
base (site déployé avant un premier run de scraping post-mise à jour),
les exécuter une fois dans le SQL Editor de Supabase :
```sql
ALTER TABLE offres ADD COLUMN IF NOT EXISTS masque BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE offres ADD COLUMN IF NOT EXISTS manuel BOOLEAN NOT NULL DEFAULT FALSE;
```

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
