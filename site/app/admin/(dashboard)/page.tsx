import { getOffresStats, getDerniereMaj } from "@/lib/db";
import Link from "next/link";
import { getAbonnesStats, type AbonnesStats } from "@/lib/abonnes";
import { compterMessagesNonTraites } from "@/lib/messages";
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

/** Barres doubles inscriptions (indigo) / désabonnements (gris) par semaine. */
function Semaines({ data }: { data: AbonnesStats["parSemaine"] }) {
  const max = Math.max(1, ...data.flatMap((s) => [s.inscriptions, s.desabonnements]));
  return (
    <div>
      <div className="flex h-28 items-end gap-2">
        {data.map((s) => (
          <div key={s.semaine} className="flex flex-1 items-end justify-center gap-0.5">
            <div
              className="w-1/2 max-w-3 rounded-t bg-indigo-500"
              style={{ height: `${(s.inscriptions / max) * 100}%`, minHeight: s.inscriptions ? 3 : 0 }}
              title={`${s.inscriptions} inscription(s)`}
            />
            <div
              className="w-1/2 max-w-3 rounded-t bg-gray-300"
              style={{ height: `${(s.desabonnements / max) * 100}%`, minHeight: s.desabonnements ? 3 : 0 }}
              title={`${s.desabonnements} désabonnement(s)`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-[10px] text-gray-400">
        {data.map((s) => (
          <span key={s.semaine} className="flex-1 text-center">
            {s.semaine.slice(8, 10)}/{s.semaine.slice(5, 7)}
          </span>
        ))}
      </div>
      <p className="mt-2 flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-indigo-500" /> Inscriptions
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-gray-300" /> Désabonnements
        </span>
        <span className="ml-auto">semaine du lundi</span>
      </p>
    </div>
  );
}

function formatMaj(iso: string | null): string {
  if (!iso) return "jamais";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminDashboardPage() {
  const [offresStats, abonnesStats, derniereMaj, messagesNonTraites] = await Promise.all([
    getOffresStats(),
    getAbonnesStats(),
    getDerniereMaj(),
    compterMessagesNonTraites(),
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

        <Carte titre="Messages de contact">
          <p className="text-3xl font-bold text-gray-900">{messagesNonTraites ?? "—"}</p>
          <p className="mt-1 text-xs text-gray-500">
            non traité(s) ·{" "}
            <Link prefetch={false} href="/admin/messages" className="text-indigo-600 hover:underline">
              voir les messages
            </Link>
          </p>
        </Carte>

        <Carte titre="Abonnés : 8 dernières semaines">
          {abonnesStats ? <Semaines data={abonnesStats.parSemaine} /> : "—"}
        </Carte>

        <Carte titre="Abonnés par ville">
          {abonnesStats ? <Repartition items={abonnesStats.parVille} label="ville" /> : "—"}
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
