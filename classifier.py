# -*- coding: utf-8 -*-
"""Classification des offres de STAGE au Maroc (tous domaines, tous types).

Contrairement à sourcing-regie-banque/classifier.py (régie vs CDI, secteur
banque, cœur métier IT/PMO), il n'y a ici qu'UNE question de fond :
« est-ce vraiment un stage, ouvert, basé au Maroc ? ». Le domaine métier
n'est jamais un critère d'exclusion — juste un TAG informatif pour trier
dans Excel (cf. tag_domaine).

Architecture : détecteurs individuels (detect_stage, hors_maroc, fenêtre de
fraîcheur) composés par verdict_of(), comme dans le projet banque — mais en
beaucoup plus court, puisqu'il n'y a plus de lexiques métier ni de logique
régie/CDI à démêler.
"""
import datetime as dt
import re
import unicodedata

# --------------------------------------------------------------- TEXTE UTILS
def strip_accents(s):
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c))


def _strip_invisibles(s):
    """Retire les caractères invisibles (marques directionnelles, liants,
    contrôles) qui peuvent casser une détection par mot-clé — cf. incident
    réel documenté dans sourcing-regie-banque/classifier.py ("Type de
    recrutement : ‎ Stage" avec un U+200E invisible entre les deux mots)."""
    return "".join(c for c in (s or "")
                   if unicodedata.category(c) not in ("Cf", "Cc") or c in "\n\t")


def _pad(s):
    return " " + (s or "").lower() + " "


def has_any(text, kws):
    t = _pad(text)
    return any(k in t for k in kws)


def normalize_title(title):
    """Titre normalisé pour comparer/dédupliquer les annonces entre sources."""
    t = strip_accents(title).lower()
    t = re.sub(r"\(.*?\)", " ", t)
    t = re.sub(r"\bh\s*/?\s*f\b", " ", t)
    t = re.sub(r"\b(stagiaire|stage|junior|debutant|confirme|confirmee|"
               r"de|d|le|la|les|un|une|en|pour|the|and)\b", " ", t)
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def dedup_annonces(annonces):
    """Retire les doublons exacts (même entreprise + même titre normalisé +
    même début de texte) — les sources renvoient parfois 2 fois la même
    offre. Conserve l'URL de la première occurrence."""
    seen, out = set(), []
    for a in annonces:
        key = (strip_accents(a.get("entite", "")).lower().strip(),
               normalize_title(a.get("poste", "")),
               (a.get("texte", "") or "")[:150].strip())
        if key in seen:
            continue
        seen.add(key)
        out.append(a)
    return out


# ----------------------------------------------------------------- DETECTION
# Titre : un de ces mots dans le TITRE suffit (signal à haute précision).
STAGE_TITLE_KW = [
    "stage", "stagiaire", "stagiaires", "pfe", "internship", "intern ",
    "alternance", "alternant", "alternante", "apprenti", "apprentie",
    "fin d'etudes", "fin d etudes", "fin d'études",
]

# Texte : formulation explicite du CONTRAT lui-même (pas juste "encadrer un
# stagiaire" ou "expérience de stage souhaitée", qui parlent d'autre chose).
# Repris du principe de STAGE_ALT_CDD_RE (sourcing-regie-banque/classifier.py)
# mais en POSITIF : ici on veut détecter le stage, pas l'exclure. Les motifs
# s'arrêtent volontairement avant les caractères accentués (ex. "fin d")
# pour matcher indifféremment "fin d'études"/"fin d'etudes".
STAGE_CONTRAT_RE = re.compile(
    r"type de (?:contrat|poste|recrutement)\s*:\s*(?:stage|stagiaire|alternance|apprentissage)"
    r"|contrat de stage|convention de stage|stage conventionn|gratification de stage"
    r"|offre de stage|poste de stagiaire|stage de fin d|stage (?:pfe|d.ete|d.initiation|decouverte)"
    r"|recherchons? un\(?e?\)? stagiaire|recrutons? un\(?e?\)? stagiaire"
    r"|contrat d.?(?:alternance|apprentissage)|poste en alternance|offre d.?alternance"
    r"|recherchons? un\(?e?\)? alternant",
    re.I)

# Garde-fou : un poste manifestement confirmé/senior qui ne mentionne "stage"
# nulle part dans le titre n'est pas requalifié en stage sur une simple
# mention lointaine dans le texte (ex. "les stages sont pris en compte" dans
# les prérequis d'un poste CDI confirmé).
SENIOR_EXCLU_KW = [
    "cdi confirme", "cdi confirmé", "profil senior", "poste permanent",
    "5 ans d'experience minimum", "5 ans d'expérience minimum",
    "3 ans d'experience minimum", "3 ans d'expérience minimum",
    "temps plein indetermine", "temps plein indéterminé",
]

# Garde-fou : un poste qui ENCADRE/COORDONNE des stagiaires n'est PAS
# lui-même un stage, même si "stage(s)" apparaît dans son titre — cas réel
# observé sur Rekrute.com : "Coordinateur(trice) des stages étudiants"
# (CDI, Bac+5, 3 ans d'expérience requis) matchait à tort sur "stage" dans
# "stages étudiants".
COORD_STAGE_RE = re.compile(
    r"coordinateur.{0,4}trice.{0,4}\)?\s*des stages|coordinateur des stages"
    r"|coordinatrice des stages|responsable des stages|responsable stages"
    r"|gestionnaire des stages|charge.{0,2} des stages|chargee des stages"
    r"|referent.{0,2} stages|maitre de stage|tuteur de stage"
    r"|encadrant.{0,3} de stagiaires|encadrement de stagiaires",
    re.I)


# "intern" (valeur standard schema.org employmentType="INTERN", utilisée
# par Stagiaires.ma) : ne collisionne pas avec "interim"/"intérim" (EMP_
# NEGATIF_KW ci-dessous) -- "interim" ne contient pas la sous-chaîne
# "intern" (après "inter" vient "im", pas "n").
EMP_POSITIF_KW = ("stage", "alternance", "apprentissage", "intern")
# Valeurs de "type de contrat" sans ambiguïté possible avec un stage.
# Volontairement PAS "temps plein"/"temps partiel"/"contrat" : sur LinkedIn
# ce champ décrit souvent un HORAIRE, pas la nature du contrat, et de vrais
# stages y sont étiquetés "Temps plein" (cas réel constaté).
EMP_NEGATIF_KW = ("cdi", "cdd", "interim", "intérim", "benevolat", "bénévolat")


def detect_stage(poste, texte, emploi_label=""):
    """(est_stage: bool, type_stage: str, motif: str).

    Ordre de priorité (du plus au moins fiable) :
      1. Garde-fou "encadrement de stagiaires" (titre) -> jamais un stage,
         sauf si le champ structuré dit explicitement le contraire.
      2. Titre contient un mot-clé stage à haute précision -> stage.
      3. Champ structuré "type de contrat" (emploi_label), quand disponible
         (LinkedIn `crit`, Rekrute "Type de contrat proposé") -> tranche.
         Cas réel qui a motivé cette priorité : deux offres "Graphic
         Designer en CDD" dont le texte mentionne "stage pfe" en passant
         (contexte candidat : "étudiant en stage pfe OU jeune diplômé"),
         alors que le champ structuré dit clairement CDI/CDD.
      4. À défaut de champ structuré : déclaration explicite du CONTRAT
         dans le texte (STAGE_CONTRAT_RE), avec garde-fou senior/CDI.
    """
    poste_n = _strip_invisibles(poste).lower()
    blob = _strip_invisibles(f"{poste} . {texte}").lower()
    emp = _strip_invisibles(emploi_label or "").lower()

    if COORD_STAGE_RE.search(poste_n):
        if not any(k in emp for k in ("stage", "alternance", "apprentissage")):
            return False, "", "poste d'encadrement de stagiaires, pas un stage"

    titre_stage = any(k in (" " + poste_n + " ") for k in STAGE_TITLE_KW)
    if titre_stage:
        return True, type_stage_tag(blob), ""

    if emp:
        if any(k in emp for k in EMP_POSITIF_KW):
            return True, type_stage_tag(blob), ""
        # Négatif FIABLE seulement : "Temps plein"/"Contrat" (valeurs
        # génériques de LinkedIn) ne suffisent pas — cas réel observé :
        # une vraie offre "Stage PFE" chez Boostoo est étiquetée "Temps
        # plein" côté LinkedIn (le champ y décrit un horaire, pas la
        # nature du contrat). CDI/CDD/Intérim n'ont pas cette ambiguïté.
        if any(k in emp for k in EMP_NEGATIF_KW):
            return False, "", f"type de contrat déclaré : {emploi_label}"

    if STAGE_CONTRAT_RE.search(blob):
        return True, type_stage_tag(blob), ""

    # Mention faible du mot "stage" ailleurs que le titre, sans déclaration de
    # contrat explicite, ET profil clairement senior/CDI -> pas un stage.
    if has_any(blob, ["stage", "stagiaire"]) and has_any(blob, SENIOR_EXCLU_KW):
        return False, "", "mention de stage isolée sur un poste senior/CDI"

    return False, "", "pas de signal de stage"


def type_stage_tag(blob):
    """Catégorie informative — ne filtre rien (le projet accepte tous les
    types de stage)."""
    if any(k in blob for k in ("pfe", "fin d etudes", "fin d'etudes",
                                "fin d'études", "projet de fin d")):
        return "PFE / fin d'études"
    if any(k in blob for k in ("alternance", "alternant", "apprentissage",
                                "apprenti")):
        return "Alternance"
    if any(k in blob for k in ("stage d'ete", "stage d ete", "stage d'été",
                                "stage d'initiation", "stage d initiation",
                                "stage decouverte", "stage découverte",
                                "stage ouvrier")):
        return "Été / initiation"
    return "Non précisé"


# Tags de domaine — INFORMATIFS SEULEMENT (n'excluent jamais une offre),
# conformément au choix "tous domaines confondus". Permettent juste à
# l'utilisateur de filtrer/trier lui-même dans Excel.
DOMAINE_KW = {
    "Informatique / Data": [
        "informatique", "developpeur", "développeur", "developpement",
        "développement", "data", "reseau", "réseau", "cybersecurite",
        "cybersécurité", "cyber", "cloud", "systeme d'information",
        "système d'information", " si ", "logiciel", "software", "python",
        "java", "devops", "intelligence artificielle", " ia ",
        "machine learning", "big data", "base de donnees",
        "base de données", "full stack", "backend", "frontend",
    ],
    "Ingénierie / Industrie": [
        "ingenieur", "ingénieur", "genie civil", "génie civil", "mecanique",
        "mécanique", "electrique", "électrique", "electromecanique",
        "électromécanique", "production", "maintenance", "qualite",
        "qualité", "process", "automatisme", "industriel", "btp",
        "genie industriel", "génie industriel", "chantier",
    ],
    "Finance / Comptabilité": [
        "comptable", "comptabilite", "comptabilité", "finance", "audit",
        "controle de gestion", "contrôle de gestion", "fiscal",
        "tresorerie", "trésorerie", "credit", "crédit", "banque",
        "bancaire", "assurance",
    ],
    "Logistique / Transport / Achats": [
        "logistique", "transport", "supply chain", "transitaire", "freight",
        "douane", "entreposage", "approvisionnement", "achat", "achats",
        "magasinier", "affretement", "affrètement",
    ],
    "Commerce / Marketing / Vente": [
        "commercial", "vente", "marketing", "communication",
        "business developer", "chef de produit", "digital marketing",
        "community manager",
    ],
    "RH": [
        "ressources humaines", " rh ", "recrutement", "talent acquisition",
        "formation", "paie",
    ],
    "Juridique": ["juridique", "droit", "legal", "légal", "contentieux",
                  "avocat", "notaire"],
    "Santé": ["medecin", "médecin", "infirmier", "pharmacie", "sante",
              "santé", "hopital", "hôpital", "clinique", "biomedical",
              "biomédical"],
}


def tag_domaine(poste, texte):
    """Tag informatif — priorité au TITRE (plus fiable) avant de retomber
    sur le texte complet (une compétence citée en passant dans le corps,
    ex. "compétences informatiques" pour un poste logistique, ne doit pas
    l'emporter sur un titre déjà explicite)."""
    poste_l = f" {poste} ".lower()
    for label, kws in DOMAINE_KW.items():
        if any(k in poste_l for k in kws):
            return label
    texte_l = f" {poste} {texte} ".lower()
    for label, kws in DOMAINE_KW.items():
        if any(k in texte_l for k in kws):
            return label
    return "Autre"


# ----------------------------------------------------------------- GEOGRAPHIE
# Marqueurs de villes/pays clairement hors Maroc (repris + étendus depuis
# sourcing-regie-banque : ici la France est aussi hors scope, contrairement
# à l'autre projet). Cherché dans le TITRE et la VILLE uniquement (pas le
# texte : une offre à Casablanca qui mentionne un client basé à Paris ne
# doit pas être exclue).
GEO_HORS_MAROC_KW = [
    "france", "paris", "lyon", "marseille", "toulouse", "bordeaux", "nantes",
    "lille", "strasbourg", "nice", "ile-de-france", "île-de-france",
    "brazil", "bresil", "brésil", "sao paulo", "dubai", "abu dhabi", "qatar",
    "doha", "london", "londres", "geneve", "genève", "geneva", "zurich",
    "luxembourg", "bruxelles", "brussels", "belgique", "belgium",
    "montreal", "montréal", "new york", "singapore", "singapour",
    "hong kong", "allemagne", "germany", "berlin", "munich", "madrid",
    "barcelone", "barcelona", "espagne", "spain", "milan", "milano",
    "italie", "italy", "amsterdam", "pays-bas", "riyadh", "riyad",
    "abidjan", "dakar", "tunis", "tunisie", "algerie", "algérie",
    "senegal", "sénégal", "cote d'ivoire", "côte d'ivoire",
]


def hors_maroc(poste, ville):
    blob = strip_accents(f"{poste} {ville}").lower()
    if "maroc" in blob or "morocco" in blob:
        return False
    return any(k in blob for k in GEO_HORS_MAROC_KW)


# Normalisation du nom de ville — le champ brut LinkedIn/Rekrute est très
# bruité en pratique (région entière, préfixe administratif, arabe, "et
# périphérie"...) : constaté sur données réelles, ~26 chaînes distinctes
# pour ~15 villes effectives (ex. "Casablanca, Casablanca-Settat, Maroc",
# "Méchouar de Casablanca, ...", "الدار البيضاء سطات...", "Casablanca et
# périphérie" — tout ça pour Casablanca). Sans normalisation, le filtre
# "Ville" du site devient inutilisable (10+ variantes de la même ville).
# Liste non exhaustive : le repli (premier segment, préfixes retirés)
# couvre les villes absentes de la liste.
VILLES_CONNUES = [
    ("Casablanca", ["casablanca", "الدار البيضاء", "كازابلانكا"]),
    ("Rabat", ["rabat", "الرباط"]),
    ("Marrakech", ["marrakech", "مراكش"]),
    ("Tanger", ["tanger", "طنجة"]),
    ("Fès", ["fes", "fès", "فاس"]),
    ("Agadir", ["agadir", "أكادير"]),
    ("Meknès", ["meknes", "meknès", "مكناس"]),
    ("Oujda", ["oujda", "وجدة"]),
    ("Kénitra", ["kenitra", "kénitra", "القنيطرة"]),
    ("Tétouan", ["tetouan", "tétouan", "تطوان"]),
    ("Salé", ["sale", "salé", "سلا"]),
    ("Témara", ["temara", "témara", "تمارة"]),
    ("Mohammedia", ["mohammedia", "المحمدية"]),
    ("El Jadida", ["el jadida", "الجديدة"]),
    ("Béni Mellal", ["beni mellal", "béni mellal", "بني ملال"]),
    ("Nador", ["nador", "الناظور"]),
    ("Settat", ["settat", "سطات"]),
    ("Berrechid", ["berrechid", "برشيد"]),
    ("Khouribga", ["khouribga", "خريبكة"]),
    ("Safi", ["safi", "آسفي"]),
    ("Larache", ["larache", "العرائش"]),
    ("Ben Guerir", ["ben guerir", "بن جرير"]),
    ("Bouskoura", ["bouskoura", "بوسكورة"]),
    ("Ait Melloul", ["ait melloul", "أيت ملول"]),
    ("Oualidia", ["oualidia", "الوليدية"]),
]
_PREFIXES_ADMIN = ("préfecture de ", "prefecture de ", "province de ", "région de ", "region de ")


def normalize_ville(ville):
    """Ville canonique à partir d'un texte de localisation brut. Priorité au
    PREMIER segment (avant la première virgule) — c'est en général la ville
    précise, la suite étant la région/le pays. Repli sur tout le texte, puis
    sur "Maroc (non précisé)" si rien n'est identifiable (cas réel : des
    offres LinkedIn où l'employeur n'a saisi que le pays)."""
    if not ville or not ville.strip():
        return "Maroc (non précisé)"
    v_full = strip_accents(ville).lower()
    premier = ville.split(",")[0].strip()
    premier_l = strip_accents(premier).lower()

    for canon, variantes in VILLES_CONNUES:
        if any(strip_accents(v).lower() in premier_l for v in variantes):
            return canon
    for canon, variantes in VILLES_CONNUES:
        if any(strip_accents(v).lower() in v_full for v in variantes):
            return canon

    if "maroc" in v_full or "morocco" in v_full:
        return "Maroc (non précisé)"

    for prefixe in _PREFIXES_ADMIN:
        if premier_l.startswith(prefixe):
            premier = premier[len(prefixe):].strip()
            break
    return premier or "Maroc (non précisé)"


# -------------------------------------------------------------------- DATES
_REL_RE = re.compile(r"il y a\s+(\d+)\s*(jour|jours|semaine|semaines|"
                      r"mois|an|ans|heure|heures|minute|minutes)", re.I)


def parse_date(annonce, today):
    """(date_iso, age_jours, source) — priorité : date ISO scrapée, sinon
    'il y a X' relatif, sinon (None, None, "inconnu")."""
    td = dt.date.fromisoformat(today)
    iso = (annonce.get("date_pub") or "").strip()[:10]
    if re.match(r"\d{4}-\d{2}-\d{2}$", iso):
        d = dt.date.fromisoformat(iso)
        return iso, (td - d).days, "iso"
    rel = (annonce.get("posted_relative") or "").replace("\xa0", " ")
    m = _REL_RE.search(rel)
    if m:
        n, unit = int(m.group(1)), m.group(2).lower()
        days = {"heure": 0, "heures": 0, "minute": 0, "minutes": 0,
                "jour": 1, "jours": 1, "semaine": 7, "semaines": 7,
                "mois": 30, "an": 365, "ans": 365}[unit] * n
        d = td - dt.timedelta(days=days)
        return d.isoformat(), days, "relatif"
    return None, None, "inconnu"


_CAND_RE = re.compile(r"(\d+)\s*(?:premiers?\s+candidats?|candidats?|applicants?)", re.I)


def parse_applicants(annonce):
    if annonce.get("nb_candidats") not in (None, ""):
        try:
            return int(annonce["nb_candidats"])
        except (ValueError, TypeError):
            pass
    txt = (annonce.get("nb_candidats_txt") or "").replace("\xa0", " ")
    m = _CAND_RE.search(txt)
    return int(m.group(1)) if m else None


def fenetre_from_age(age, cloturee, republie, nb_cand=None, open_confirme=False):
    """Fraîcheur de l'offre — logique générique, reprise de
    sourcing-regie-banque/classifier.py (n'a rien de spécifique à un
    secteur métier)."""
    if cloturee:
        return "ÉCARTÉE (clôturée)"
    if age is None:
        return "OUVERTE" if open_confirme else "INCONNUE"
    if age <= 7:
        return "NOUVEAU"
    if age <= 21:
        return "OUVERTE"
    if republie:
        return "ROUVERTE"
    if open_confirme and age <= 90:
        return "VIVIER"
    return "AGÉE"


# ------------------------------------------------------------------ VERDICT
def verdict_of(a):
    """(verdict, motif). CONVENABLE ou ÉCARTÉE — pas de paliers, puisqu'il
    n'y a pas de profil idéal à matcher (tous domaines confondus)."""
    if not a.get("est_stage"):
        return "ÉCARTÉE", a.get("motif_stage") or "pas un stage"
    if a.get("hors_maroc_flag"):
        return "ÉCARTÉE", "hors Maroc"
    if a.get("fenetre") == "ÉCARTÉE (clôturée)":
        return "ÉCARTÉE", "clôturée"
    return "CONVENABLE", ""


def classifier(annonce, today=None):
    """Classe UNE annonce. Renvoie l'annonce enrichie (nouveau dict, jamais
    modifiée en place)."""
    today = today or dt.date.today().isoformat()
    poste = _strip_invisibles(annonce.get("poste", ""))
    texte = _strip_invisibles(annonce.get("texte", "") or "")
    entite = _strip_invisibles(annonce.get("entite", ""))
    ville = annonce.get("ville", "") or annonce.get("lieu", "")

    est_stage, type_stg, motif_stage = detect_stage(
        poste, texte, annonce.get("emploi_label", ""))
    domaine = tag_domaine(poste, texte)
    hm = hors_maroc(poste, ville)
    date_iso, age, date_source = parse_date(annonce, today)
    nb_cand = parse_applicants(annonce)
    fen = fenetre_from_age(age, annonce.get("cloturee"),
                            annonce.get("republication"), nb_cand,
                            annonce.get("open_confirme"))

    out = dict(annonce)
    out.update({
        "poste": poste, "texte": texte, "entite": entite,
        "est_stage": est_stage, "type_stage": type_stg,
        "motif_stage": motif_stage, "domaine": domaine,
        "hors_maroc_flag": hm,
        "date_pub_iso": date_iso, "age_jours": age, "date_source": date_source,
        "nb_candidats_int": nb_cand, "fenetre": fen,
        # Écrase le champ brut par la ville canonique (hors_maroc, lui, a
        # déjà tranché sur le texte brut ci-dessus — plus de signal utile).
        "ville": normalize_ville(ville),
    })
    verdict, motif = verdict_of(out)
    out["verdict"] = verdict
    out["motif"] = motif
    return out


def classify_all(annonces, today=None):
    """dédup -> classification -> tri (convenables d'abord, plus récentes
    d'abord)."""
    today = today or dt.date.today().isoformat()
    items = [classifier(a, today) for a in dedup_annonces(annonces)]
    items.sort(key=lambda a: (0 if a["verdict"] == "CONVENABLE" else 1,
                               a["age_jours"] if a.get("age_jours") is not None else 9999))
    return items
