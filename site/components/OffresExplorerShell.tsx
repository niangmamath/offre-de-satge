"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFavoris } from "@/lib/favoris";
import { CapIcon, ChatIcon, MailboxIcon } from "@/components/icons";

const TOUS = "Tous";
const PAR_PAGE = 30;
const PUBLICATION_OPTIONS = [
  "Toutes les dates",
  "Aujourd'hui ou hier",
  "7 derniers jours",
  "30 derniers jours",
];

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z" />
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

type Props = {
  total: number;
  affiche: number;
  nouvelles: number;
  derniereMaj: string | null;
  villes: string[];
  domaines: string[];
  typesStage: string[];
  showCount: number;
  canShowMore: boolean;
  children: React.ReactNode;
};

// Shell client minimal : rend uniquement le header + les controles de filtre.
// Les cartes elles-memes arrivent en {children} depuis le composant serveur
// (app/page.tsx), deja filtrees et paginees cote SQL. Gain : plus aucune
// donnee d'offre dans le bundle client -- avant, les 600 Offre etaient
// serialisees (~500 Ko) pour que le filtre useMemo puisse tourner cote JS.
// Favoris + "masquer anciennes" restent client (localStorage / toggle
// instantane) : on les applique en CSS sur les wrappers data-slug/data-fenetre
// que le serveur a emis autour de chaque OffreCard.
export default function OffresExplorerShell({
  total,
  affiche,
  nouvelles,
  derniereMaj,
  villes,
  domaines,
  typesStage,
  showCount,
  canShowMore,
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const { favoris } = useFavoris();

  const q = sp.get("q") ?? "";
  const domaine = sp.get("domaine") ?? TOUS;
  const typeStage = sp.get("type_stage") ?? TOUS;
  const ville = sp.get("ville") ?? TOUS;
  const publication = sp.get("publication") ?? PUBLICATION_OPTIONS[0];
  const [favorisSeuls, setFavorisSeuls] = useState(sp.get("favoris") === "1");
  const [masquerAgees, setMasquerAgees] = useState(sp.get("ma") === "1");

  // Champ de recherche : debounced 350ms puis push dans l'URL. Sans debounce,
  // chaque frappe declenche une nav RSC et le serveur ne tient pas la cadence.
  const [qLocal, setQLocal] = useState(q);
  useEffect(() => setQLocal(q), [q]);
  useEffect(() => {
    if (qLocal === q) return;
    const t = setTimeout(() => updateParam("q", qLocal, { resetShow: true }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  const updateParam = useCallback(
    (clef: string, valeur: string | null, opts: { resetShow?: boolean } = {}) => {
      const next = new URLSearchParams(sp.toString());
      const isDefaut =
        !valeur ||
        valeur === TOUS ||
        valeur === PUBLICATION_OPTIONS[0] ||
        valeur === "";
      if (isDefaut) next.delete(clef);
      else next.set(clef, valeur);
      if (opts.resetShow) next.delete("show");
      const qs = next.toString();
      start(() =>
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      );
    },
    [sp, pathname, router]
  );

  // Favoris : filtre purement client, applique en CSS sur les wrappers emis
  // par le serveur. Quand le mode est actif ET qu'aucun favori ne figure dans
  // la page SSR actuelle, on ne va pas forcer un re-fetch -- l'utilisateur
  // verra le vide, c'est le comportement attendu.
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-slug]");
    cards.forEach((el) => {
      const slug = el.dataset.slug ?? "";
      const fenetre = el.dataset.fenetre ?? "";
      const cacheFav = favorisSeuls && !favoris.includes(slug);
      const cacheAge = masquerAgees && (fenetre === "AGÉE" || fenetre === "INCONNUE");
      el.style.display = cacheFav || cacheAge ? "none" : "";
    });
  }, [favorisSeuls, masquerAgees, favoris, children]);

  const nbFavoris = favoris.length;
  const filtresActifs =
    !!q || domaine !== TOUS || typeStage !== TOUS || ville !== TOUS || publication !== PUBLICATION_OPTIONS[0];

  return (
    <>
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
            Tous domaines, tous types de stage — PFE, pré-embauche, été, initiation.
          </p>

          <div className="relative mt-4 max-w-2xl">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="Rechercher un poste, une entreprise…"
              className="w-full rounded-full border-0 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 shadow-lg outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-white sm:text-base"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {total > 0 ? (
              <p className="text-xs text-indigo-100 sm:text-sm">
                <span className="font-semibold text-white">{total}</span> offres actives
                {" · "}
                <span className="font-semibold text-white">{nouvelles}</span> nouvelle
                {nouvelles !== 1 ? "s" : ""}
                {" · "}
                <span className="font-semibold text-white">{domaines.length}</span> domaines
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
          <div
            className={`sticky top-3 z-10 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:flex-wrap sm:items-center ${pending ? "opacity-60" : ""}`}
          >
            <Select
              label="Domaine"
              value={domaine}
              onChange={(v) => updateParam("domaine", v === TOUS ? null : v, { resetShow: true })}
              options={[TOUS, ...domaines]}
            />
            <Select
              label="Type de stage"
              value={typeStage}
              onChange={(v) => updateParam("type_stage", v === TOUS ? null : v, { resetShow: true })}
              options={[TOUS, ...typesStage]}
            />
            <Select
              label="Ville"
              value={ville}
              onChange={(v) => updateParam("ville", v === TOUS ? null : v, { resetShow: true })}
              options={[TOUS, ...villes]}
            />
            <Select
              label="Publication"
              value={publication}
              onChange={(v) => updateParam("publication", v, { resetShow: true })}
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
                <path strokeLinejoin="round" d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 16.9l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86L12 3.5z" />
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
            {filtresActifs ? (
              <button
                type="button"
                onClick={() => start(() => router.push(pathname, { scroll: false }))}
                className="whitespace-nowrap text-xs font-medium text-indigo-600 hover:underline"
              >
                Reinitialiser
              </button>
            ) : null}
          </div>

          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{affiche}</span> offre
            {affiche !== 1 ? "s" : ""} sur <span className="font-semibold text-gray-700">{total}</span>
            {(favorisSeuls || masquerAgees) ? " (filtres locaux appliques en plus)" : ""}
          </p>

          {affiche === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              Aucune offre ne correspond à ces critères.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {children}
              </div>
              {canShowMore ? (
                <button
                  type="button"
                  onClick={() => updateParam("show", String(showCount + PAR_PAGE))}
                  disabled={pending}
                  className="mx-auto rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {pending ? "Chargement…" : `Voir plus d'offres (${affiche - showCount} restantes)`}
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
