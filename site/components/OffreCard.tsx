import type { Offre } from "@/lib/db";

const FENETRE_STYLE: Record<string, string> = {
  NOUVEAU: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  OUVERTE: "bg-teal-50 text-teal-700 ring-teal-600/20",
  ROUVERTE: "bg-sky-50 text-sky-700 ring-sky-600/20",
  VIVIER: "bg-amber-50 text-amber-800 ring-amber-600/20",
  "AGÉE": "bg-gray-100 text-gray-600 ring-gray-500/20",
  INCONNUE: "bg-gray-50 text-gray-500 ring-gray-400/20",
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
  const fenetreStyle = FENETRE_STYLE[offre.fenetre] ?? FENETRE_STYLE.INCONNUE;
  const estNouvelle = offre.fenetre === "NOUVEAU";

  return (
    <a
      href={offre.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${
        estNouvelle
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
          {offre.poste}
        </h3>
        <Badge className={fenetreStyle}>{offre.fenetre}</Badge>
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
        <span>{offre.source}</span>
      </div>
    </a>
  );
}
