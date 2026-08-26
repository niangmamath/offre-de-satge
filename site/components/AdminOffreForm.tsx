"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINES_NEWSLETTER } from "@/lib/newsletter-domaines";

const TYPES_STAGE = ["Non précisé", "PFE / fin d'études", "Alternance", "Été / initiation"];

export type OffreFormValues = {
  poste: string;
  entite: string;
  ville: string;
  description: string;
  domaine: string;
  type_stage: string;
  duree: string;
  indemnite: string;
};

const VIDE: OffreFormValues = {
  poste: "",
  entite: "",
  ville: "",
  description: "",
  domaine: "Autre",
  type_stage: "Non précisé",
  duree: "",
  indemnite: "",
};

export default function AdminOffreForm({
  initial,
  url,
}: {
  initial?: OffreFormValues;
  url?: string;
}) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState<OffreFormValues>(initial ?? VIDE);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const modeEdition = !!url;

  function champ<K extends keyof OffreFormValues>(cle: K) {
    return {
      value: valeurs[cle],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setValeurs((v) => ({ ...v, [cle]: e.target.value })),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/offres/${modeEdition ? "modifier" : "creer"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modeEdition ? { url, ...valeurs } : valeurs),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Échec de l'enregistrement.");
        return;
      }
      router.push("/admin/offres");
      router.refresh();
    } catch {
      setErreur("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const labelClass = "text-xs font-medium text-gray-600";

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Poste *</span>
        <input required className={inputClass} {...champ("poste")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Entreprise *</span>
        <input required className={inputClass} {...champ("entite")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Ville</span>
        <input className={inputClass} {...champ("ville")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Description</span>
        <textarea rows={5} className={inputClass} {...champ("description")} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Domaine</span>
          <select className={inputClass} {...champ("domaine")}>
            {DOMAINES_NEWSLETTER.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Type de stage</span>
          <select className={inputClass} {...champ("type_stage")}>
            {TYPES_STAGE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Durée</span>
          <input className={inputClass} placeholder="ex. 6 mois" {...champ("duree")} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Indemnité</span>
          <input className={inputClass} placeholder="ex. 3000 MAD/mois" {...champ("indemnite")} />
        </label>
      </div>

      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : modeEdition ? "Enregistrer" : "Créer l'offre"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/offres")}
          className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
