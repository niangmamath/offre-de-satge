"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offre } from "@/lib/db";
import OffreCard from "./OffreCard";
import { useFavoris } from "@/lib/favoris";
import Link from "next/link";
import { CapIcon, ChatIcon, MailboxIcon } from "@/components/icons";

const TOUS = "Tous";
const PAR_PAGE = 30;
// Filtre "Publication" : âge maximal en jours (age_jours, calculé par le pipeline).
const PUBLICATION: Record<string, number | null> = {
  "Toutes les dates": null,
  "Aujourd'hui ou hier": 1,
  "7 derniers jours": 7,
  "30 derniers jours": 30,
};
const PUBLICATION_OPTIONS = Object.keys(PUBLICATION);

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z"
      />
    </svg>
  );
}

function formatMaj(iso: string | null): string {
  if (!iso) return "jamais";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  });
}

export default function OffresExplorer({
  offres,
  derniereMaj,
}: {
  offres: Offre[];
  derniereMaj: string | null;
}) {
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState(TOUS);
  const [typeStage, setTypeStage] = useState(TOUS);
  const [ville, setVille] = useState(TOUS);
  const [masquerAgees, setMasquerAgees] = useState(false);
  const [publication, setPublication] = useState(PUBLICATION_OPTIONS[0]);
  const [favorisSeuls, setFavorisSeuls] = useState(false);
  const { favoris } = useFavoris();
  const [visibles, setVisibles] = useState(PAR_PAGE);

  const domaines = useMemo(() => [TOUS, ...uniqueSorted(offres.map((o) => o.domaine))], [offres]);
  const typesStage = useMemo(
    () => [TOUS, ...uniqueSorted(offres.map((o) => o.type_stage))],
    [offres]
  );
  const villes = useMemo(() => [TOUS, ...uniqueSorted(offres.map((o) => o.ville))], [offres]);

  const nouvelles = useMemo(() => offres.filter((o) => o.fenetre === "NOUVEAU").length, [offres]);
  // Seulement les favoris encore présents parmi les offres actives.
  const nbFavoris = useMemo(
    () => offres.filter((o) => favoris.includes(o.slug)).length,
    [offres, favoris]
  );

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const ageMax = PUBLICATION[publication];
    // "offres" arrive déjà triée par date de publication (requête SQL).
    return offres.filter((o) => {
      if (favorisSeuls && !favoris.includes(o.slug)) return false;
      if (ageMax !== null && (o.age_jours === null || o.age_jours > ageMax)) return false;
      if (domaine !== TOUS && o.domaine !== domaine) return false;
      if (typeStage !== TOUS && o.type_stage !== typeStage) return false;
      if (ville !== TOUS && o.ville !== ville) return false;
      if (masquerAgees && (o.fenetre === "AGÉE" || o.fenetre === "INCONNUE")) return false;
      if (q) {
        const blob = `${o.poste} ${o.entite ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [offres, recherche, domaine, typeStage, ville, masquerAgees, publication, favorisSeuls, favoris]);

  // Revient à la 1re page de résultats à chaque changement de filtre —
  // sinon "visibles" pourrait rester élevé sur une liste filtrée bien plus
  // courte, ou au contraire cacher des résultats pertinents après un
  // nouveau filtre plus restrictif.
  useEffect(() => {
    setVisibles(PAR_PAGE);
  }, [recherche, domaine, typeStage, ville, masquerAgees, publication, favorisSeuls]);

  const affichees = filtrees.slice(0, visibles);

  return (
    <>
      {/* Hero compact avec recherche intégrée */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_10%,white,transparent_30%),radial-gradient(circle_at_85%_0%,white,transparent_25%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              <CapIcon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
              Stages au Maroc
            </h1>
            <p className="text-xs text-indigo-200">Mis à jour : {formatMaj(derniereMaj)}</p>
          </div>
          <p className="mt-1 max-w-xl text-sm text-indigo-100">
            Tous domaines, tous types de stage — PFE, été, initiation, alternance.
          </p>

          <div className="relative mt-4 max-w-2xl">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un poste, une entreprise…"
              className="w-full rounded-full border-0 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 shadow-lg outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-white sm:text-base"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {offres.length > 0 ? (
              <p className="text-xs text-indigo-100 sm:text-sm">
                <span className="font-semibold text-white">{offres.length}</span> offres actives
                {" · "}
                <span className="font-semibold text-white">{nouvelles}</span> nouvelle
                {nouvelles !== 1 ? "s" : ""}
                {" · "}
                <span className="font-semibold text-white">{domaines.length - 1}</span> domaines
              </p>
            ) : null}
            <a
              href="#newsletter"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/25 sm:text-sm"
            >
              <MailboxIcon className="h-4 w-4 shrink-0" />
              Recevoir les nouvelles offres par email
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/25 sm:text-sm"
            >
              <ChatIcon className="h-4 w-4 shrink-0" />
              Nous contacter
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <div className="sticky top-3 z-10 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:flex-wrap sm:items-center">
            <Select label="Domaine" value={domaine} onChange={setDomaine} options={domaines} />
            <Select
              label="Type de stage"
              value={typeStage}
              onChange={setTypeStage}
              options={typesStage}
            />
            <Select label="Ville" value={ville} onChange={setVille} options={villes} />
            <Select
              label="Publication"
              value={publication}
              onChange={setPublication}
              options={PUBLICATION_OPTIONS}
            />
            <button
              type="button"
              aria-pressed={favorisSeuls}
              onClick={() => setFavorisSeuls((v) => !v)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition ${
                favorisSeuls
                  ? "bg-amber-50 text-amber-700 ring-amber-300"
                  : "text-gray-600 ring-gray-300 hover:ring-amber-300"
              }`}
            >
              <svg
                className={`h-4 w-4 ${favorisSeuls || nbFavoris ? "text-amber-500" : "text-gray-400"}`}
                viewBox="0 0 24 24"
                fill={favorisSeuls ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinejoin="round"
                  d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 16.9l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86L12 3.5z"
                />
              </svg>
              Mes favoris ({nbFavoris})
            </button>
            <label className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-600">
              <input
                type="checkbox"
                checked={masquerAgees}
                onChange={(e) => setMasquerAgees(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Masquer les offres anciennes
            </label>
          </div>

          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{filtrees.length}</span> offre
            {filtrees.length !== 1 ? "s" : ""} affichée{filtrees.length !== 1 ? "s" : ""} sur{" "}
            {offres.length}
          </p>

          {filtrees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              {favorisSeuls && nbFavoris === 0
                ? "Vous n'avez pas encore de favoris : cliquez sur l'étoile d'une offre pour la sauvegarder."
                : "Aucune offre ne correspond à ces critères."}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {affichees.map((o) => (
                  <OffreCard key={o.url} offre={o} />
                ))}
              </div>
              {visibles < filtrees.length ? (
                <button
                  type="button"
                  onClick={() => setVisibles((v) => v + PAR_PAGE)}
                  className="mx-auto rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Voir plus d&apos;offres ({filtrees.length - visibles} restantes)
                </button>
              ) : null}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
