# -*- coding: utf-8 -*-
"""Tests unitaires du classifieur stages-maroc. Couvre la logique
réellement nouvelle de ce projet (détection stage, tag domaine, géographie
Maroc) — pas une redite des 865 lignes de sourcing-regie-banque/
test_classifier.py, qui testent une logique métier différente (régie/CDI,
secteur banque)."""
import unittest

import classifier as C


def _annonce(**kw):
    base = {
        "poste": "", "entite": "Entreprise Test", "ville": "Casablanca, Maroc",
        "url": "https://example.com/offre-1", "date_pub": "", "texte": "",
        "posted_relative": "", "nb_candidats_txt": "", "cloturee": False,
        "republication": "", "open_confirme": False, "source": "LinkedIn",
    }
    base.update(kw)
    return base


class TestDetectStage(unittest.TestCase):
    def test_titre_stagiaire(self):
        est, typ, motif = C.detect_stage("Stagiaire en Sourcing RH", "")
        self.assertTrue(est)

    def test_titre_pfe(self):
        est, typ, motif = C.detect_stage("Stage PFE - Développeur Python", "")
        self.assertTrue(est)
        self.assertEqual(typ, "PFE / fin d'études")

    def test_titre_alternance(self):
        est, typ, motif = C.detect_stage("Alternant Comptabilité H/F", "")
        self.assertTrue(est)
        self.assertEqual(typ, "Alternance")

    def test_contrat_explicite_dans_le_texte(self):
        est, typ, motif = C.detect_stage(
            "Assistant Marketing",
            "Nous proposons une offre de stage de 6 mois à Casablanca.")
        self.assertTrue(est)

    def test_convention_de_stage(self):
        est, typ, motif = C.detect_stage(
            "Chargé RH",
            "Convention de stage obligatoire, Bac+4/5 en RH requis.")
        self.assertTrue(est)

    def test_faux_positif_mention_isolee_poste_senior(self):
        """Cas réel observé sur Rekrute.com : un poste clairement CDI/senior
        qui mentionne juste que les stages passés comptent comme expérience —
        ce n'est PAS une offre de stage."""
        est, typ, motif = C.detect_stage(
            "Chargé de Recrutement Confirmé",
            "Vous justifiez d'une expérience probante en recrutement "
            "(les stages sont pris en compte). Profil senior recherché, "
            "5 ans d'experience minimum.")
        self.assertFalse(est)

    def test_cdi_sans_aucune_mention_stage(self):
        est, typ, motif = C.detect_stage(
            "Comptable Confirmé H/F",
            "Poste en CDI, temps plein indéterminé, 3 ans d'expérience minimum.")
        self.assertFalse(est)
        self.assertEqual(motif, "pas de signal de stage")

    def test_stage_ete(self):
        est, typ, _ = C.detect_stage("Stage d'été - Communication", "")
        self.assertTrue(est)
        self.assertEqual(typ, "Été / initiation")

    def test_internship_anglais(self):
        est, typ, _ = C.detect_stage("Marketing Internship Morocco", "")
        self.assertTrue(est)

    def test_faux_positif_coordinateur_des_stages(self):
        """Cas réel Rekrute.com : un poste qui ENCADRE des stagiaires
        (CDI, Bac+5, 3 ans d'expérience) matchait à tort sur "stage" dans
        "stages étudiants"."""
        est, typ, motif = C.detect_stage(
            "Coordinateur(trice) des stages étudiants",
            "Vous serez responsable de la gestion des relations "
            "partenariales pour les stages. Type de contrat proposé : CDI",
            emploi_label="CDI")
        self.assertFalse(est)

    def test_champ_structure_prioritaire_sur_mention_isolee(self):
        """Cas réel Rekrute.com : le texte mentionne "stage pfe" en passant
        (contexte candidat), mais le champ structuré dit clairement CDD ->
        ce n'est pas une offre de stage."""
        est, typ, motif = C.detect_stage(
            "Graphic Designer en CDD",
            "étudiant(e) en dernière année dans le cadre d'un stage pfe ou "
            "jeune diplômé(e) à la recherche d'une première expérience "
            "professionnelle en cdd.",
            emploi_label="CDD")
        self.assertFalse(est)

    def test_champ_structure_confirme_stage(self):
        est, typ, motif = C.detect_stage(
            "Freight Forwarders", "débutants acceptés, stages ou diplômés",
            emploi_label="Stage")
        self.assertTrue(est)

    def test_linkedin_temps_plein_nignore_pas_un_stage_evident(self):
        """Cas réel LinkedIn : une vraie offre "Stage PFE" est étiquetée
        "Temps plein" côté LinkedIn (champ = horaire, pas nature du
        contrat) — ne doit PAS être écartée."""
        est, typ, motif = C.detect_stage(
            "Stage PFE — Projet de Fin d'Études", "Mission : un PFE...",
            emploi_label="Temps plein")
        self.assertTrue(est)

    def test_linkedin_temps_plein_sans_titre_explicite_reste_ecarte(self):
        """"Temps plein" seul (sans mot-clé stage dans le titre ni
        déclaration explicite dans le texte) ne doit pas non plus être
        pris pour un signal positif."""
        est, typ, motif = C.detect_stage(
            "Analyste Junior", "Poste au sein de notre équipe.",
            emploi_label="Temps plein")
        self.assertFalse(est)


class TestTagDomaine(unittest.TestCase):
    def test_informatique(self):
        self.assertEqual(
            C.tag_domaine("Stage Développeur Full Stack", ""),
            "Informatique / Data")

    def test_finance(self):
        self.assertEqual(
            C.tag_domaine("Stagiaire Comptabilité", "Gestion de la trésorerie"),
            "Finance / Comptabilité")

    def test_rh(self):
        self.assertEqual(
            C.tag_domaine("Stagiaire Ressources Humaines", ""), "RH")

    def test_autre_par_defaut(self):
        self.assertEqual(
            C.tag_domaine("Stagiaire Polyvalent", "Missions diverses"), "Autre")

    def test_titre_prioritaire_sur_texte(self):
        """Cas réel Rekrute.com : un poste logistique dont le texte mentionne
        "compétences informatiques" en prérequis secondaire ne doit pas être
        tagué Informatique — le titre est plus fiable."""
        self.assertEqual(
            C.tag_domaine("Stage pré-embauche Freight Forwarders",
                           "maîtrise de l'anglais et des compétences "
                           "informatiques sont requises"),
            "Logistique / Transport / Achats")


class TestGeographie(unittest.TestCase):
    def test_casablanca_ok(self):
        self.assertFalse(C.hors_maroc("Stage Marketing", "Casablanca, Maroc"))

    def test_ville_avec_pays_entre_parentheses(self):
        self.assertFalse(C.hors_maroc("Stage RH", "Kénitra (Maroc)"))

    def test_paris_exclu(self):
        self.assertTrue(C.hors_maroc("Stage Marketing", "Paris, France"))

    def test_dubai_exclu(self):
        self.assertTrue(C.hors_maroc("Stage Finance - Dubai", ""))

    def test_ville_vide_sans_marqueur_etranger(self):
        self.assertFalse(C.hors_maroc("Stage", ""))


class TestFenetre(unittest.TestCase):
    def test_nouveau(self):
        self.assertEqual(C.fenetre_from_age(3, False, ""), "NOUVEAU")

    def test_ouverte(self):
        self.assertEqual(C.fenetre_from_age(15, False, ""), "OUVERTE")

    def test_rouverte(self):
        self.assertEqual(C.fenetre_from_age(40, False, "republié"), "ROUVERTE")

    def test_vivier_si_source_active(self):
        self.assertEqual(
            C.fenetre_from_age(50, False, "", open_confirme=True), "VIVIER")

    def test_agee_sans_signal(self):
        self.assertEqual(C.fenetre_from_age(120, False, ""), "AGÉE")

    def test_cloturee(self):
        self.assertEqual(
            C.fenetre_from_age(5, True, ""), "ÉCARTÉE (clôturée)")

    def test_age_inconnu_sans_source_active(self):
        self.assertEqual(C.fenetre_from_age(None, False, ""), "INCONNUE")

    def test_age_inconnu_avec_source_active(self):
        self.assertEqual(
            C.fenetre_from_age(None, False, "", open_confirme=True), "OUVERTE")


class TestVerdict(unittest.TestCase):
    def test_ecarte_si_pas_stage(self):
        v, motif = C.verdict_of({"est_stage": False, "motif_stage": "pas de signal de stage"})
        self.assertEqual(v, "ÉCARTÉE")
        self.assertEqual(motif, "pas de signal de stage")

    def test_ecarte_si_hors_maroc(self):
        v, motif = C.verdict_of({"est_stage": True, "hors_maroc_flag": True})
        self.assertEqual(v, "ÉCARTÉE")
        self.assertEqual(motif, "hors Maroc")

    def test_ecarte_si_cloturee(self):
        v, motif = C.verdict_of({"est_stage": True, "hors_maroc_flag": False,
                                  "fenetre": "ÉCARTÉE (clôturée)"})
        self.assertEqual(v, "ÉCARTÉE")

    def test_convenable(self):
        v, motif = C.verdict_of({"est_stage": True, "hors_maroc_flag": False,
                                  "fenetre": "NOUVEAU"})
        self.assertEqual(v, "CONVENABLE")
        self.assertEqual(motif, "")


class TestClassifierEndToEnd(unittest.TestCase):
    def test_stage_convenable_recent(self):
        a = _annonce(poste="Stage PFE - Data Analyst",
                      texte="Offre de stage de fin d'études, 6 mois, Casablanca.",
                      date_pub="2026-08-18")
        out = C.classifier(a, today="2026-08-20")
        self.assertEqual(out["verdict"], "CONVENABLE")
        self.assertEqual(out["type_stage"], "PFE / fin d'études")
        self.assertEqual(out["domaine"], "Informatique / Data")
        self.assertEqual(out["fenetre"], "NOUVEAU")

    def test_cdi_ecarte(self):
        a = _annonce(poste="Comptable Confirmé H/F",
                      texte="CDI, temps plein indéterminé, 5 ans d'experience minimum.")
        out = C.classifier(a, today="2026-08-20")
        self.assertEqual(out["verdict"], "ÉCARTÉE")

    def test_stage_paris_ecarte_hors_maroc(self):
        a = _annonce(poste="Stagiaire Marketing", ville="Paris, France")
        out = C.classifier(a, today="2026-08-20")
        self.assertEqual(out["verdict"], "ÉCARTÉE")
        self.assertEqual(out["motif"], "hors Maroc")


class TestDedupAndSort(unittest.TestCase):
    def test_dedup_annonces(self):
        a1 = _annonce(poste="Stagiaire RH", entite="ACME",
                       texte="Description identique du poste proposé.")
        a2 = dict(a1)
        a2["url"] = "https://example.com/offre-2"  # même annonce, source différente
        out = C.dedup_annonces([a1, a2])
        self.assertEqual(len(out), 1)

    def test_classify_all_tri_convenables_dabord(self):
        vieux_convenable = _annonce(
            poste="Stagiaire A", url="https://example.com/a",
            texte="offre de stage", date_pub="2026-06-01")
        ecarte = _annonce(
            poste="Comptable CDI", url="https://example.com/b",
            texte="CDI temps plein indetermine 5 ans d'experience minimum")
        items = C.classify_all([ecarte, vieux_convenable], today="2026-08-20")
        self.assertEqual(items[0]["verdict"], "CONVENABLE")
        self.assertEqual(items[-1]["verdict"], "ÉCARTÉE")


class TestParsing(unittest.TestCase):
    def test_parse_date_iso(self):
        iso, age, src = C.parse_date({"date_pub": "2026-08-13"}, "2026-08-20")
        self.assertEqual(iso, "2026-08-13")
        self.assertEqual(age, 7)
        self.assertEqual(src, "iso")

    def test_parse_date_relatif(self):
        iso, age, src = C.parse_date(
            {"date_pub": "", "posted_relative": "il y a 3 jours"}, "2026-08-20")
        self.assertEqual(age, 3)
        self.assertEqual(src, "relatif")

    def test_parse_applicants(self):
        self.assertEqual(
            C.parse_applicants({"nb_candidats_txt": "27 candidats"}), 27)

    def test_parse_applicants_absent(self):
        self.assertIsNone(C.parse_applicants({"nb_candidats_txt": ""}))


if __name__ == "__main__":
    unittest.main()
