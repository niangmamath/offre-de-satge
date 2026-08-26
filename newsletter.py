# -*- coding: utf-8 -*-
"""Digest périodique par email : liste les offres détectées depuis le
dernier envoi (1 semaine) aux abonnés confirmés, avec des liens vers le SITE
(pas directement vers LinkedIn/Rekrute).

Envoi par SMTP direct (pas de service tiers) — même pattern que
sourcing-regie-banque/send_mail.py : smtplib + STARTTLS, identifiants en
variables d'environnement, dégrade proprement (jamais de plantage) si
absents. Un email PAR abonné (jamais de destinataires groupés en copie
visible), avec un lien de désabonnement personnalisé dans chaque envoi.

N'envoie RIEN s'il n'y a aucune offre neuve depuis le dernier passage —
un digest vide use la patience des abonnés et la réputation du compte
d'envoi pour rien.

Usage :
    python newsletter.py             # envoi réel (nécessite les variables SMTP)
    python newsletter.py --dry-run   # construit et affiche, n'envoie rien
"""
import os
import smtplib
import sys
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

TABLE_SQL = """
CREATE TABLE IF NOT EXISTS abonnes (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    confirme BOOLEAN NOT NULL DEFAULT FALSE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    dernier_envoi TIMESTAMPTZ
)
"""

# Migration additive idempotente (même pattern que db_sync.py) : la table
# peut déjà exister depuis avant l'ajout de la préférence de domaine, et ce
# script peut tourner (GitHub Actions) indépendamment du site Next.js qui
# gère sa propre migration côté site/lib/abonnes.ts sur la même colonne.
MIGRATIONS_SQL = [
    "ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS domaine_prefere TEXT",
]

MAX_OFFRES_PAR_MAIL = 8

# Logo "casquette de diplome" en SVG inline -- evite l'emoji, dont le rendu
# (police systeme) varie trop d'un client mail a l'autre (meme raison que
# site/lib/mailer.ts:logoSvg(), duplique ici car runtime Python separe).
LOGO_SVG_BLANC = (
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" '
    'stroke-width="2" style="vertical-align:middle;margin-right:8px;display:inline-block;">'
    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/>'
    '<path stroke-linecap="round" stroke-linejoin="round" '
    'd="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"/>'
    '<path stroke-linecap="round" d="M21 8v6"/>'
    "</svg>"
)
DELAI_ENTRE_ENVOIS_S = 1.5  # pacing best-effort, évite de brusquer le fournisseur SMTP


def _env(nom, defaut=None):
    """.strip() systématique : un secret GitHub/Vercel copié-collé peut
    embarquer un retour à la ligne invisible (incident réel documenté dans
    sourcing-regie-banque/drive_sync.py — même précaution ici). Un secret
    GitHub Actions absent devient une chaîne VIDE (pas inexistante) une
    fois injecté dans l'environnement -- traitée ici comme absente, sinon
    le défaut ne s'applique jamais et un simple oubli de configuration
    peut planter un run au lieu de dégrader proprement (incident réel :
    int("") sur SMTP_PORT)."""
    v = os.environ.get(nom)
    v = v.strip() if isinstance(v, str) else v
    return v if v else defaut


def offres_recentes(cur, jours=7, limite=MAX_OFFRES_PAR_MAIL, domaine=None):
    """domaine=None -> tous domaines confondus (abonnés sans préférence)."""
    if domaine:
        cur.execute(
            """
            SELECT poste, entite, ville, slug FROM offres
            WHERE premiere_detection >= now() - (%s || ' days')::interval
              AND domaine = %s
            ORDER BY premiere_detection DESC
            """,
            (str(jours), domaine),
        )
    else:
        cur.execute(
            """
            SELECT poste, entite, ville, slug FROM offres
            WHERE premiere_detection >= now() - (%s || ' days')::interval
            ORDER BY premiere_detection DESC
            """,
            (str(jours),),
        )
    rows = cur.fetchall()
    return rows[:limite], max(0, len(rows) - limite)


def abonnes_actifs(cur):
    cur.execute(
        "SELECT id, email, token, domaine_prefere FROM abonnes "
        "WHERE confirme = TRUE AND actif = TRUE"
    )
    return cur.fetchall()


def grouper_par_domaine(abonnes):
    """{domaine_prefere (ou None = tous domaines) : [abonnés]}. Ne calculer
    la liste d'offres correspondante qu'UNE FOIS par groupe, pas par
    abonné (évite de refaire la même requête des dizaines de fois)."""
    groupes = {}
    for a in abonnes:
        groupes.setdefault(a[3], []).append(a)
    return groupes


def construire_html(offres, reste, site_url, token, domaine=None):
    lignes = "".join(
        f"""<tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
              <a href="{site_url}/offre/{slug}" style="color:#4338ca;font-weight:600;text-decoration:none;font-size:15px;">{poste}</a><br>
              <span style="color:#666;font-size:13px;">{entite or ''}{' · ' + ville if ville else ''}</span>
            </td></tr>"""
        for poste, entite, ville, slug in offres
    )
    plus = (
        f'<p style="color:#666;font-size:13px;">…et {reste} autre(s) offre(s) sur le site.</p>'
        if reste else ""
    )
    sous_titre = f"Les nouvelles offres · {domaine}" if domaine else "Les nouvelles offres de la semaine"
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#4338ca,#7c3aed);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">{LOGO_SVG_BLANC}Stages au Maroc</h1>
        <p style="color:#e0e7ff;margin:6px 0 0;font-size:14px;">{sous_titre}</p>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:20px 24px;border-radius:0 0 12px 12px;">
        <table style="width:100%;border-collapse:collapse;">{lignes}</table>
        {plus}
        <a href="{site_url}" style="display:block;text-align:center;margin-top:20px;background:linear-gradient(135deg,#4338ca,#7c3aed);color:#fff;padding:12px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
          Voir toutes les offres
        </a>
        <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;">
          Vous recevez ce mail car vous êtes abonné à la newsletter Stages au Maroc.<br>
          <a href="{site_url}/api/desabonner?token={token}" style="color:#999;">Se désabonner</a>
        </p>
      </div>
    </div>
    """


def _smtp_connect():
    # Un secret GitHub Actions absent devient une chaine VIDE (pas
    # inexistante) une fois injectee dans l'environnement -- il faut donc
    # verifier la presence AVANT tout int()/traitement, sinon un simple
    # oubli de configuration plante le run au lieu de degrader proprement.
    server = _env("SMTP_SERVER")
    user = _env("SMTP_USER")
    password = _env("SMTP_PASS")
    from_email = _env("FROM_EMAIL") or user
    if not (server and user and password and from_email):
        return None
    port = int(_env("SMTP_PORT", "587"))
    smtp = smtplib.SMTP(server, port, timeout=30)
    smtp.starttls()
    smtp.login(user, password)
    return smtp, from_email


def envoyer_groupe(smtp, from_email, cur, conn, abonnes, offres, reste, site_url,
                    domaine=None, dry_run=False):
    """abonnes : lignes (id, email, token, domaine_prefere) d'UN SEUL groupe
    (déjà filtré par grouper_par_domaine) -- reçoivent toutes le MÊME digest
    (déjà calculé pour ce groupe précis par l'appelant)."""
    label = domaine or "tous domaines"
    if dry_run:
        print(f"  [newsletter] DRY-RUN [{label}] : {len(abonnes)} abonné(s) recevraient "
              f"{len(offres)} offre(s) (+{reste} de plus).")
        print(construire_html(offres, reste, site_url, "TOKEN_EXEMPLE", domaine))
        return 0

    envoyes = 0
    for abonne_id, email, token, _ in abonnes:
        html = construire_html(offres, reste, site_url, token, domaine)
        sujet = f"{len(offres)} nouvelle(s) offre(s) de stage au Maroc"
        if domaine:
            sujet += f" · {domaine}"
        msg = MIMEMultipart("alternative")
        msg["Subject"] = sujet
        msg["From"] = from_email
        msg["To"] = email
        msg.attach(MIMEText(html, "html", "utf-8"))
        try:
            smtp.sendmail(from_email, [email], msg.as_string())
            cur.execute(
                "UPDATE abonnes SET dernier_envoi = now() WHERE id = %s",
                (abonne_id,))
            envoyes += 1
        except Exception as e:
            print(f"  [newsletter] échec envoi à {email} : {e}")
        time.sleep(DELAI_ENTRE_ENVOIS_S)
    conn.commit()

    print(f"  [newsletter] [{label}] {envoyes}/{len(abonnes)} email(s) envoyé(s).")
    return envoyes


def main():
    dry_run = "--dry-run" in sys.argv[1:]
    database_url = _env("DATABASE_URL")
    site_url = _env("SITE_URL", "https://example.com")
    if not database_url:
        print("  [newsletter] DATABASE_URL non définie — abandon.")
        return

    try:
        import psycopg2
    except ImportError:
        print("  [newsletter] psycopg2 non installé — abandon.")
        return

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(TABLE_SQL)
            for migration in MIGRATIONS_SQL:
                cur.execute(migration)
            conn.commit()

            abonnes = abonnes_actifs(cur)
            if not abonnes:
                print("  [newsletter] aucun abonné confirmé actif — rien à envoyer.")
                return

            connexion = None if dry_run else _smtp_connect()
            if not dry_run and not connexion:
                print("  [newsletter] variables SMTP absentes (SMTP_SERVER/PORT/USER/PASS) "
                      "— envoi ignoré.")
                return
            smtp, from_email = connexion if connexion else (None, None)

            try:
                total = 0
                # Un groupe par préférence de domaine (None = tous domaines
                # confondus) : la requête d'offres n'est faite qu'UNE FOIS par
                # groupe, pas par abonné.
                for domaine, groupe in grouper_par_domaine(abonnes).items():
                    offres, reste = offres_recentes(cur, domaine=domaine)
                    if not offres:
                        label = domaine or "tous domaines"
                        print(f"  [newsletter] [{label}] aucune offre neuve depuis "
                              f"1 semaine — rien envoyé à ce groupe.")
                        continue
                    total += envoyer_groupe(
                        smtp, from_email, cur, conn, groupe, offres, reste,
                        site_url, domaine=domaine, dry_run=dry_run)
                if total == 0 and not dry_run:
                    print("  [newsletter] aucune offre neuve pour aucun groupe — rien envoyé.")
            finally:
                if smtp:
                    try:
                        smtp.quit()
                    except Exception:
                        pass
    finally:
        conn.close()


if __name__ == "__main__":
    main()
