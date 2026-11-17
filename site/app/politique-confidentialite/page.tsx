import type { Metadata } from "next";
import Link from "next/link";
import { CapIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité du site Stages au Maroc : données collectées (newsletter, contact), cookies, publicité AdSense, droits GDPR et loi 09-08.",
  alternates: { canonical: "/politique-confidentialite" },
  robots: { index: true, follow: true },
};

export default function PolitiqueConfidentialite() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_10%,white,transparent_30%),radial-gradient(circle_at_85%_0%,white,transparent_25%)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-100 transition hover:text-white"
          >
            ← Retour au site
          </Link>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            <CapIcon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            Politique de confidentialité
          </h1>
          <p className="mt-2 text-xs text-indigo-100">
            Dernière mise à jour : novembre 2026
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <article className="prose prose-sm sm:prose-base max-w-none space-y-6 text-gray-700">
          <Section titre="En bref">
            <p>
              Ce site collecte des données uniquement si vous le choisissez
              explicitement : inscription à la newsletter, ou envoi du
              formulaire de contact.
            </p>
            <p>
              Le site affiche aussi des publicités Google AdSense, qui
              utilisent des cookies tiers, et mesure son audience de manière
              anonyme via Vercel Analytics.
            </p>
          </Section>

          <Section titre="Newsletter (optionnelle)">
            <p>
              Si vous vous inscrivez à la newsletter, nous collectons votre{" "}
              <strong>adresse email</strong>, et optionnellement une ville et
              un domaine (pour filtrer les offres envoyées). Une double
              confirmation par code (OTP) est demandée pour vérifier que
              l&apos;adresse vous appartient.
            </p>
            <p>
              Ces données sont stockées dans notre base Postgres (Neon,
              hébergée aux États-Unis) et utilisées uniquement pour
              l&apos;envoi hebdomadaire des nouvelles offres. L&apos;envoi
              est assuré par Resend Inc.
            </p>
            <p>
              <strong>Désabonnement</strong> : chaque email contient un lien
              de désinscription en un clic. Vous pouvez aussi écrire à{" "}
              <a
                href="mailto:niangmamathyacine@gmail.com"
                className="text-indigo-600 font-medium hover:underline"
              >
                niangmamathyacine@gmail.com
              </a>{" "}
              pour demander la suppression de vos données.
            </p>
          </Section>

          <Section titre="Formulaire de contact (optionnel)">
            <p>
              Si vous utilisez le formulaire de contact, nous collectons
              votre nom, votre email et le contenu de votre message,
              uniquement pour vous répondre. Ces données ne sont jamais
              utilisées à d&apos;autres fins ni cédées à des tiers.
            </p>
          </Section>

          <Section titre="Publicité (Google AdSense)">
            <p>
              Ce site affiche des publicités via <strong>Google
              AdSense</strong>. Google et ses partenaires utilisent des
              cookies tiers pour afficher des annonces en fonction de votre
              historique de navigation et personnaliser l&apos;expérience
              publicitaire.
            </p>
            <p>
              Vous pouvez consulter la{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-indigo-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                politique Google sur les annonces
              </a>{" "}
              et désactiver la personnalisation publicitaire sur{" "}
              <a
                href="https://www.google.com/settings/ads"
                className="text-indigo-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                adssettings.google.com
              </a>
              . Vous pouvez également refuser les cookies tiers directement
              dans les réglages de votre navigateur.
            </p>
          </Section>

          <Section titre="Mesures d'audience (Vercel Analytics)">
            <p>
              Nous utilisons{" "}
              <a
                href="https://vercel.com/docs/analytics"
                className="text-indigo-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Vercel Analytics
              </a>{" "}
              pour compter les pages vues de manière agrégée. Vercel
              Analytics est <strong>sans cookie</strong> et <strong>sans
              identifiant persistant</strong> : chaque visite est anonymisée
              par un hash quotidien impossible à relier à une personne.
            </p>
          </Section>

          <Section titre="Cookies">
            <p>
              Ce site lui-même ne dépose aucun cookie de tracking. Les
              cookies présents proviennent uniquement de Google AdSense
              (publicité). Le navigateur peut utiliser le stockage local
              (localStorage) pour mémoriser vos filtres sélectionnés, mais
              ce stockage reste sur votre appareil.
            </p>
          </Section>

          <Section titre="Durée de conservation">
            <p>
              Les emails des abonnés à la newsletter sont conservés tant que
              l&apos;abonnement est actif. Les messages envoyés via le
              formulaire de contact sont conservés 12 mois puis supprimés.
            </p>
          </Section>

          <Section titre="Vos droits">
            <p>
              Conformément au{" "}
              <strong>Règlement général sur la protection des données
              (RGPD)</strong> et à la{" "}
              <strong>loi marocaine 09-08</strong> relative à la protection
              des personnes physiques à l&apos;égard du traitement des
              données à caractère personnel, vous disposez des droits
              d&apos;accès, de rectification, d&apos;effacement,
              d&apos;opposition et de portabilité.
            </p>
            <p>
              Pour exercer ces droits : envoyez un email à{" "}
              <a
                href="mailto:niangmamathyacine@gmail.com"
                className="text-indigo-600 font-medium hover:underline"
              >
                niangmamathyacine@gmail.com
              </a>
              . Réponse sous 30 jours.
            </p>
          </Section>

          <Section titre="Modifications">
            <p>
              Cette politique peut être mise à jour pour refléter des
              changements techniques ou légaux. La date de dernière mise à
              jour est affichée en haut de page.
            </p>
          </Section>
        </article>
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-gray-400 sm:px-6">
          <Link href="/" className="hover:text-gray-600">
            Retour à l&apos;accueil
          </Link>
          {" · "}
          <Link href="/mentions-legales" className="hover:text-gray-600">
            Mentions légales
          </Link>
          {" · "}
          <Link href="/contact" className="hover:text-gray-600">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{titre}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
