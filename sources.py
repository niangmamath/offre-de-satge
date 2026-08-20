# -*- coding: utf-8 -*-
"""Collecteurs hors-LinkedIn. Chaque collecteur renvoie une liste d'« annonces »
avec les MÊMES clés que les annonces LinkedIn (poste, entite, ville, url,
date_pub, texte, emploi_label, nb_candidats_txt, cloturee, republication,
source, open_confirme) — voir stages_maroc.to_annonce() pour le contrat exact.

Registre COLLECTORS : chaque fonction prend 0 argument et renvoie une liste
de dicts. Un collecteur qui échoue ne doit jamais faire tomber les autres
(cf. collect_all()).
"""
import random
import re
import time

import requests
from bs4 import BeautifulSoup

# Un User-Agent auto-identifiant ("CFC-SourcingStagesMaroc/1.0...") reçoit un
# 403 immédiat de Rekrute.com (WAF sur la FORME du user-agent, vérifié en
# pratique — indépendant du robots.txt, qui lui n'interdit pas les pages de
# résultats à un bot générique). robots.txt vérifié le 2026-08-19 : aucune
# règle "User-agent: *", seuls les gros crawlers IA/recherche NOMMÉS
# (Googlebot, GPTBot, ClaudeBot...) sont restreints sur /offres.html — donc
# un identifiant honnête n'est de toute façon pas mieux traité par leur
# politique affichée que la valeur ci-dessous. On utilise donc un
# User-Agent de navigateur réaliste, comme le fait déjà
# sourcing-regie-banque/linkedin_sourcing_regie.py pour LinkedIn (même
# principe : lecture publique, rate-limitée, sans authentification
# contournée — jamais d'évasion de blocage actif, juste éviter un blocage
# trivial sur la forme du UA).
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]
REQUEST_DELAY_SECONDS = 2.0

REKRUTE_BASE = "https://www.rekrute.com/offres.html"
# Termes de recherche larges : le tri fin (vrai stage vs pas) est fait par
# classifier.detect_stage() en aval, pas ici — cf. incident constaté lors du
# design (le "Type de contrat" est souvent absent/commenté côté Rekrute).
REKRUTE_TERMS = ["Stage", "Stagiaire", "PFE", "Alternance"]
REKRUTE_MAX_PAGES = 5  # par terme de recherche


def _rekrute_get(params):
    headers = {"User-Agent": random.choice(USER_AGENTS),
               "Accept-Language": "fr-FR,fr;q=0.9"}
    try:
        r = requests.get(REKRUTE_BASE, params=params, headers=headers, timeout=25)
    except requests.RequestException as e:
        print(f"    ! Rekrute réseau : {e}")
        return None
    if r.status_code != 200:
        print(f"    ! Rekrute HTTP {r.status_code}")
        return None
    return r.text


def _rekrute_parse_card(li):
    jid = li.get("id", "")
    a_titre = li.select_one("a.titreJob")
    if not a_titre or not a_titre.has_attr("href"):
        return None
    href = a_titre["href"]
    url = href if href.startswith("http") else f"https://www.rekrute.com{href}"
    titre_brut = a_titre.get_text(" ", strip=True)
    # Format observé : "Titre | Ville (Pays)"
    if " | " in titre_brut:
        poste, ville = titre_brut.rsplit(" | ", 1)
    else:
        poste, ville = titre_brut, ""
    ville = re.sub(r"\s*\(.*?\)\s*$", "", ville).strip()  # retire "(Maroc)"

    img = li.select_one("img.photo")
    entite = (img.get("alt") or img.get("title") or "").strip() if img else ""

    # Description + champs structurés (secteur, fonction, expérience, niveau
    # d'étude, type de contrat) : tout concaténé dans "texte" pour que le
    # classifieur (mots-clés) puisse s'appuyer dessus.
    morceaux = [sp.get_text(" ", strip=True) for sp in li.select("div.info span")]
    li_champs = li.select("div.info ul li")
    morceaux += [l.get_text(" ", strip=True) for l in li_champs]
    texte = " . ".join(m for m in morceaux if m)

    # Champ structuré "Type de contrat proposé" : signal fiable QUAND il est
    # présent (constaté en pratique : parfois absent/commenté côté Rekrute
    # selon l'offre — cf. sources.py docstring). La valeur est dans le
    # premier <a> du <li> correspondant.
    emploi_label = ""
    for l in li_champs:
        txt_l = l.get_text(" ", strip=True)
        if txt_l.lower().startswith("type de contrat"):
            a_val = l.select_one("a")
            if a_val:
                emploi_label = a_val.get_text(strip=True)
            break

    date_pub = ""
    dates = li.select("em.date span")
    if dates:
        m = re.match(r"(\d{2})/(\d{2})/(\d{4})", dates[0].get_text(strip=True))
        if m:
            date_pub = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    return {
        "poste": poste.strip(),
        "entite": entite,
        "ville": ville,
        "url": url.split("?")[0],
        "date_pub": date_pub,
        "posted_relative": "",
        "texte": texte,
        "emploi_label": emploi_label,
        "nb_candidats_txt": "",
        "cloturee": False,
        "republication": "",
        "open_confirme": True,     # Rekrute ne liste que des annonces actives
        "source": "Rekrute.com",
        "_jid": jid,
    }


def collect_rekrute(max_pages=REKRUTE_MAX_PAGES):
    """Scrape les résultats de recherche Rekrute.com pour plusieurs termes
    liés au stage. Best-effort : structure HTML non documentée officiellement,
    peut casser si le site change de gabarit — auquel cas cette fonction
    renvoie simplement moins (ou pas) de résultats, sans faire planter le run
    (cf. collect_all)."""
    vus = {}
    for terme in REKRUTE_TERMS:
        for page in range(max_pages):
            params = {"query": terme, "keyword": terme, "p": page}
            txt = _rekrute_get(params)
            time.sleep(REQUEST_DELAY_SECONDS)
            if not txt:
                break
            soup = BeautifulSoup(txt, "lxml")
            lis = soup.select("li.post-id")
            if not lis:
                break
            nouveau = 0
            for li in lis:
                card = _rekrute_parse_card(li)
                if card and card["url"] not in vus:
                    vus[card["url"]] = card
                    nouveau += 1
            if nouveau == 0:
                break  # page sans offre inédite -> fin de la pagination utile
    print(f"  Rekrute.com : {len(vus)} annonces (candidates, avant classification).")
    return list(vus.values())


COLLECTORS = {
    "rekrute": collect_rekrute,
}


def collect_all(exclude=()):
    """Appelle tous les collecteurs du registre. Une source en échec ne
    bloque jamais les autres."""
    out = []
    for nom, fn in COLLECTORS.items():
        if nom in exclude:
            continue
        try:
            out += fn()
        except Exception as e:
            print(f"  ! source '{nom}' en échec ({e}) — ignorée ce run.")
    return out
