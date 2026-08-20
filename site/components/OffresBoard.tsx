"use client";

import { useMemo, useState } from "react";
import type { Offre } from "@/lib/db";
import OffreCard from "./OffreCard";

const TOUS = "Tous";

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

export default function OffresBoard({ offres }: { offres: Offre[] }) {
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState(TOUS);
  const [typeStage, setTypeStage] = useState(TOUS);
  const [ville, setVille] = useState(TOUS);
  const [masquerAgees, setMasquerAgees] = useState(false);

  const domaines = useMemo(() => [TOUS, ...uniqueSorted(offres.map((o) => o.domaine))], [offres]);
  const typesStage = useMemo(
    () => [TOUS, ...uniqueSorted(offres.map((o) => o.type_stage))],
    [offres]
  );
  const villes = useMemo(() => [TOUS, ...uniqueSorted(offres.map((o) => o.ville))], [offres]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return offres.filter((o) => {
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
  }, [offres, recherche, domaine, typeStage, ville, masquerAgees]);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-3 z-10 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full flex-1 sm:min-w-[220px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z"
            />
          </svg>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un poste ou une entreprise…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <Select label="Domaine" value={domaine} onChange={setDomaine} options={domaines} />
        <Select label="Type de stage" value={typeStage} onChange={setTypeStage} options={typesStage} />
        <Select label="Ville" value={ville} onChange={setVille} options={villes} />
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
          Aucune offre ne correspond à ces critères.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrees.map((o) => (
            <OffreCard key={o.url} offre={o} />
          ))}
        </div>
      )}
    </div>
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
