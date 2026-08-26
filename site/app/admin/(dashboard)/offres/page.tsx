import Link from "next/link";
import { getAllOffresAdmin } from "@/lib/db";
import AdminOffreActions from "@/components/AdminOffreActions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default async function AdminOffresPage() {
  const offres = await getAllOffresAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Offres ({offres.length})</h1>
          <p className="mt-1 text-xs text-gray-500">
            Les modifications sur une offre scrapée (pas manuelle) peuvent être écrasées au
            prochain passage du scraping si l&apos;offre est toujours active sur sa source.
            Pour un retrait durable, utilisez « Masquer » ou « Supprimer ».
          </p>
        </div>
        <Link
          href="/admin/offres/nouvelle"
          className="shrink-0 rounded-full bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800"
        >
          + Ajouter une offre
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Poste</th>
              <th className="px-4 py-2.5 font-medium">Entreprise</th>
              <th className="px-4 py-2.5 font-medium">Ville</th>
              <th className="px-4 py-2.5 font-medium">Statut</th>
              <th className="px-4 py-2.5 font-medium">Ajoutée le</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offres.map((o) => (
              <tr key={o.url} className={o.masque ? "bg-gray-50 text-gray-400" : ""}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/offres/modifier?url=${encodeURIComponent(o.url)}`}
                    className="font-medium text-gray-900 hover:text-indigo-700"
                  >
                    {o.poste}
                  </Link>
                  {o.manuel ? (
                    <span className="ml-2 rounded-full bg-fuchsia-50 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-700">
                      manuelle
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5">{o.entite || "—"}</td>
                <td className="px-4 py-2.5">{o.ville || "—"}</td>
                <td className="px-4 py-2.5">
                  {o.masque ? (
                    <span className="text-xs font-semibold text-gray-500">Masquée</span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600">{o.fenetre}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(o.premiere_detection)}</td>
                <td className="px-4 py-2.5">
                  <AdminOffreActions url={o.url} masque={o.masque} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {offres.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Aucune offre en base.</p>
        ) : null}
      </div>
    </div>
  );
}
