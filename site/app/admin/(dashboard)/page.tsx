import { getOffresStats, getDerniereMaj } from "@/lib/db";
import { getAbonnesStats } from "@/lib/abonnes";
import AdminTriggerButtons from "@/components/AdminTriggerButtons";

function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500">{titre}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

type Ligne = Record<string, unknown> & { n: number };

function Repartition({ items, label }: { items: Ligne[]; label: string }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between">
          <span className="text-gray-600">{String(item[label])}</span>
          <span className="font-semibold text-gray-900">{item.n}</span>
        </li>
      ))}
    </ul>
  );
}

function formatMaj(iso: string | null): string {
  if (!iso) return "jamais";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminDashboardPage() {
  const [offresStats, abonnesStats, derniereMaj] = await Promise.all([
    getOffresStats(),
    getAbonnesStats(),
    getDerniereMaj(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">Dernière mise à jour des offres : {formatMaj(derniereMaj)}</p>
      </div>

      <Carte titre="Actions">
        <AdminTriggerButtons />
      </Carte>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Carte titre="Offres actives">
          <p className="text-3xl font-bold text-gray-900">{offresStats?.total ?? "—"}</p>
          <p className="mt-1 text-xs text-gray-500">
            {offresStats?.masquees ?? 0} masquée(s) · {offresStats?.manuelles ?? 0} ajoutée(s) manuellement
          </p>
        </Carte>

        <Carte titre="Abonnés newsletter">
          <p className="text-3xl font-bold text-gray-900">{abonnesStats?.confirmesActifs ?? "—"}</p>
          <p className="mt-1 text-xs text-gray-500">
            {abonnesStats?.enAttente ?? 0} en attente de confirmation · {abonnesStats?.desabonnes ?? 0} désabonné(s)
          </p>
        </Carte>

        <Carte titre="Par fraîcheur">
          {offresStats ? <Repartition items={offresStats.parFenetre} label="fenetre" /> : "—"}
        </Carte>

        <Carte titre="Par domaine (offres)">
          {offresStats ? <Repartition items={offresStats.parDomaine} label="domaine" /> : "—"}
        </Carte>

        <Carte titre="Par source">
          {offresStats ? <Repartition items={offresStats.parSource} label="source" /> : "—"}
        </Carte>

        <Carte titre="Abonnés par préférence">
          {abonnesStats ? <Repartition items={abonnesStats.parDomaine} label="domaine" /> : "—"}
        </Carte>
      </div>
    </div>
  );
}
