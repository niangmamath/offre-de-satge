import Link from "next/link";
import type { Offre } from "@/lib/db";

const FENETRE_STYLE: Record<string, { badge: string; accent: string }> = {
  NOUVEAU: { badge: "bg-emerald-100 text-emerald-800 ring-emerald-600/20", accent: "bg-emerald-500" },
  OUVERTE: { badge: "bg-teal-50 text-teal-700 ring-teal-600/20", accent: "bg-teal-400" },
  ROUVERTE: { badge: "bg-sky-50 text-sky-700 ring-sky-600/20", accent: "bg-sky-400" },
  VIVIER: { badge: "bg-amber-50 text-amber-800 ring-amber-600/20", accent: "bg-amber-400" },
  "AGÉE": { badge: "bg-gray-100 text-gray-600 ring-gray-500/20", accent: "bg-gray-300" },
  INCONNUE: { badge: "bg-gray-50 text-gray-500 ring-gray-400/20", accent: "bg-gray-200" },
};

const DOMAINE_ICON: Record<string, string> = {
  "Informatique / Data": "💻",
  "Ingénierie / Industrie": "⚙️",
  "Logistique / Transport / Achats": "🚚",
  "Finance / Comptabilité": "💰",
  "Commerce / Marketing / Vente": "📈",
  RH: "🤝",
  Juridique: "⚖️",
  Santé: "🩺",
  Autre: "✨",
};

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "date non précisée";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function OffreCard({ offre }: { offre: Offre }) {
  const style = FENETRE_STYLE[offre.fenetre] ?? FENETRE_STYLE.INCONNUE;
  const estNouvelle = offre.fenetre === "NOUVEAU";
  const icone = DOMAINE_ICON[offre.domaine ?? ""] ?? DOMAINE_ICON.Autre;

  return (
    <Link
      href={`/offre/${offre.slug}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 pl-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} aria-hidden />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none" aria-hidden>
            {icone}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
            {offre.poste}
          </h3>
        </div>
        {estNouvelle ? null : <Badge className={`shrink-0 ${style.badge}`}>{offre.fenetre}</Badge>}
      </div>

      <div className="text-sm text-gray-600">
        <span className="font-medium text-gray-800">{offre.entite || "Entreprise non précisée"}</span>
        {offre.ville ? <span> · {offre.ville}</span> : null}
      </div>

      {offre.description ? (
        <p className="line-clamp-2 text-sm text-gray-500">{offre.description}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-600/20">
          {offre.domaine || "Autre"}
        </Badge>
        {offre.type_stage && offre.type_stage !== "Non précisé" ? (
          <Badge className="bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20">
            {offre.type_stage}
          </Badge>
        ) : null}
        {offre.duree ? (
          <Badge className="bg-gray-50 text-gray-600 ring-gray-400/20">{offre.duree}</Badge>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-400">
        <span>{formatDate(offre.date_pub_iso)}</span>
        <span className="flex items-center gap-1">
          {offre.source}
          <svg
            className="h-3 w-3 text-gray-300 transition group-hover:text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>

      {estNouvelle ? (
        <span className="absolute -right-8 top-3 rotate-45 bg-emerald-500 px-8 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Nouveau
        </span>
      ) : null}
    </Link>
  );
}
