import type { Metadata } from "next";
import Link from "next/link";
import { CapIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site Stages au Maroc : éditeur, hébergeur, finalité, sources, contact.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

export default function MentionsLegales() {
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
            Mentions légales
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <article className="prose prose-sm sm:prose-base max-w-none space-y-6 text-gray-700">
          <Section titre="Éditeur du site">
            <p>
              Ce site est un projet personnel de veille automatique édité par
              un particulier à titre non commercial. Les offres de stage
              listées sont collectées automatiquement à partir de sources
              publiques (voir section « Sources »).
            </p>
            <p>
              Pour toute question, réclamation ou demande de retrait :{" "}
              <a
                href="mailto:niangmamathyacine@gmail.com"
                className="text-indigo-600 font-medium hover:underline"
              >
                niangmamathyacine@gmail.com
              </a>
            </p>
          </Section>

          <Section titre="Hébergeur">
            <p>
              Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723,
              États-Unis — <a href="https://vercel.com" className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">vercel.com</a>.
            </p>
            <p>
              Base de données hébergée par Neon Inc. (Neon Postgres).
              Envois d&apos;emails (OTP, newsletter, contact) assurés par
              Resend Inc.
            </p>
          </Section>

          <Section titre="Finalité du service">
            <p>
              Ce site agrège automatiquement des offres de stage accessibles
              aux étudiants et jeunes diplômés basés au Maroc. L&apos;objectif
              est de faciliter la découverte et l&apos;accès à ces
              opportunités.
            </p>
            <p>
              Un formulaire de contact et une inscription à la newsletter
              hebdomadaire sont proposés (voir la{" "}
              <Link href="/politique-confidentialite" className="text-indigo-600 hover:underline">
                politique de confidentialité
              </Link>
              ). Aucune transaction n&apos;est réalisée sur ce site : chaque
              fiche renvoie vers la page officielle du recruteur où la
              candidature a lieu directement.
            </p>
          </Section>

          <Section titre="Sources des données">
            <p>
              Les offres affichées sont collectées via les pages publiques
              des plateformes suivantes, dans le respect de leurs{" "}
              <code>robots.txt</code> respectifs et avec un délai raisonnable
              entre requêtes :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>LinkedIn</strong> —{" "}
                <a href="https://www.linkedin.com" className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">linkedin.com</a>
              </li>
              <li>
                <strong>Rekrute</strong> —{" "}
                <a href="https://www.rekrute.com" className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">rekrute.com</a>
              </li>
              <li>
                <strong>Stagiaires.ma</strong> —{" "}
                <a href="https://www.stagiaires.ma" className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">stagiaires.ma</a>
              </li>
            </ul>
            <p>
              Chaque fiche affichée porte le nom de sa source et un lien
              cliquable vers la page originale. Nous ne revendiquons aucune
              propriété sur ces données.
            </p>
          </Section>

          <Section titre="Monétisation">
            <p>
              Ce site affiche des publicités via <strong>Google
              AdSense</strong> pour couvrir les frais d&apos;hébergement et
              de domaine. Ces publicités utilisent des cookies tiers — voir
              la{" "}
              <Link href="/politique-confidentialite" className="text-indigo-600 hover:underline">
                politique de confidentialité
              </Link>{" "}
              pour le détail.
            </p>
          </Section>

          <Section titre="Droit de retrait">
            <p>
              Si vous êtes recruteur d&apos;une offre listée sur ce site et
              souhaitez qu&apos;elle soit retirée, envoyez un email à{" "}
              <a
                href="mailto:niangmamathyacine@gmail.com?subject=Demande%20de%20retrait"
                className="text-indigo-600 font-medium hover:underline"
              >
                niangmamathyacine@gmail.com
              </a>{" "}
              en précisant l&apos;URL de la fiche. Le retrait est effectué
              sous 48 h ouvrées.
            </p>
          </Section>

          <Section titre="Responsabilité">
            <p>
              Les informations affichées sont collectées automatiquement et
              peuvent contenir des erreurs ou être obsolètes. Vérifiez
              toujours les conditions, la rémunération, les dates et le
              lieu directement auprès du recruteur avant de postuler.
            </p>
            <p>
              L&apos;éditeur ne peut être tenu responsable d&apos;une offre
              annulée, pourvue, ou de toute information inexacte relayée
              depuis la source d&apos;origine.
            </p>
          </Section>

          <Section titre="Propriété intellectuelle">
            <p>
              Le design, le code source du site et le code du pipeline de
              collecte sont la propriété de l&apos;éditeur. Le code est
              disponible en open source sur{" "}
              <a
                href="https://github.com/niangmamath/offre-de-satge"
                className="text-indigo-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              .
            </p>
            <p>
              Les titres, descriptions et visuels des offres restent la
              propriété de leurs recruteurs et plateformes respectives.
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
          <Link href="/politique-confidentialite" className="hover:text-gray-600">
            Politique de confidentialité
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
