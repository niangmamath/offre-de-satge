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

MAX_OFFRES_PAR_MAIL = 8
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


def offres_recentes(cur, jours=7, limite=MAX_OFFRES_PAR_MAIL):
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
        "SELECT id, email, token FROM abonnes WHERE confirme = TRUE AND actif = TRUE"
    )
    return cur.fetchall()


def construire_html(offres, reste, site_url, token):
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
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#4338ca,#7c3aed);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🎓 Stages au Maroc</h1>
        <p style="color:#e0e7ff;margin:6px 0 0;font-size:14px;">Les nouvelles offres de la semaine</p>
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


def envoyer(cur, conn, offres, reste, site_url, dry_run=False):
    abonnes = abonnes_actifs(cur)
    if not abonnes:
        print("  [newsletter] aucun abonné confirmé actif — rien à envoyer.")
        return 0

    if dry_run:
        print(f"  [newsletter] DRY-RUN : {len(abonnes)} abonné(s) recevraient "
              f"{len(offres)} offre(s) (+{reste} de plus).")
        print(construire_html(offres, reste, site_url, "TOKEN_EXEMPLE"))
        return 0

    connexion = _smtp_connect()
    if not connexion:
        print("  [newsletter] variables SMTP absentes (SMTP_SERVER/PORT/USER/PASS) "
              "— envoi ignoré.")
        return 0
    smtp, from_email = connexion

    envoyes = 0
    try:
        for abonne_id, email, token in abonnes:
            html = construire_html(offres, reste, site_url, token)
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"{len(offres)} nouvelle(s) offre(s) de stage au Maroc"
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
    finally:
        try:
            smtp.quit()
        except Exception:
            pass

    print(f"  [newsletter] {envoyes}/{len(abonnes)} email(s) envoyé(s).")
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
            conn.commit()
            offres, reste = offres_recentes(cur)
            if not offres:
                print("  [newsletter] aucune offre neuve depuis 1 semaine — rien envoyé.")
                return
            envoyer(cur, conn, offres, reste, site_url, dry_run=dry_run)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
