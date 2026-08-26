import { listerAbonnesAdmin } from "@/lib/abonnes";
import AdminAbonneActions from "@/components/AdminAbonneActions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function Statut({ confirme, actif }: { confirme: boolean; actif: boolean }) {
  if (!confirme) return <span className="text-xs font-semibold text-amber-600">En attente</span>;
  if (!actif) return <span className="text-xs font-semibold text-gray-400">Désabonné</span>;
  return <span className="text-xs font-semibold text-emerald-600">Actif</span>;
}

export default async function AdminAbonnesPage() {
  const abonnes = await listerAbonnesAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Abonnés ({abonnes.length})</h1>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Préférence</th>
              <th className="px-4 py-2.5 font-medium">Statut</th>
              <th className="px-4 py-2.5 font-medium">Inscrit le</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {abonnes.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{a.email}</td>
                <td className="px-4 py-2.5 text-gray-600">{a.domaine_prefere || "Tous domaines"}</td>
                <td className="px-4 py-2.5">
                  <Statut confirme={a.confirme} actif={a.actif} />
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(a.cree_le)}</td>
                <td className="px-4 py-2.5">
                  {a.confirme && a.actif ? <AdminAbonneActions id={a.id} /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {abonnes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Aucun abonné pour l&apos;instant.</p>
        ) : null}
      </div>
    </div>
  );
}
