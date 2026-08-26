# -*- coding: utf-8 -*-
"""Petit utilitaire d'alerte par email, appelé UNIQUEMENT quand un workflow
GitHub Actions échoue (`if: failure()`), pour ne pas avoir à aller vérifier
manuellement sur GitHub. Réutilise les mêmes secrets SMTP que newsletter.py
(pas de secret supplémentaire à configurer) et le même compte comme
destinataire (on s'envoie l'alerte à soi-même).

Dégrade proprement : si les variables SMTP sont absentes, affiche juste un
message et sort sans erreur — une alerte qui ne peut pas partir ne doit
jamais faire échouer le step "Journaux en cas d'échec" qui l'appelle.

Usage : python notifier.py "Sujet de l'alerte" "Corps du message"
"""
import os
import smtplib
import sys
from email.mime.text import MIMEText


def _env(nom):
    v = os.environ.get(nom)
    v = v.strip() if isinstance(v, str) else v
    return v or None


def envoyer_alerte(sujet, corps):
    server = _env("SMTP_SERVER")
    user = _env("SMTP_USER")
    password = _env("SMTP_PASS")
    to = _env("FROM_EMAIL") or user
    if not (server and user and password and to):
        print("  [notifier] variables SMTP absentes — alerte non envoyée.")
        return
    port = int(_env("SMTP_PORT") or "587")

    msg = MIMEText(corps, "plain", "utf-8")
    msg["Subject"] = sujet
    msg["From"] = to
    msg["To"] = to

    try:
        smtp = smtplib.SMTP(server, port, timeout=30)
        smtp.starttls()
        smtp.login(user, password)
        smtp.sendmail(to, [to], msg.as_string())
        smtp.quit()
        print(f"  [notifier] alerte envoyée à {to}.")
    except Exception as e:
        print(f"  [notifier] échec envoi de l'alerte : {e}")


if __name__ == "__main__":
    sujet = sys.argv[1] if len(sys.argv) > 1 else "Alerte pipeline Stages au Maroc"
    corps = sys.argv[2] if len(sys.argv) > 2 else "Un run a échoué. Voir les logs GitHub Actions."
    envoyer_alerte(sujet, corps)
