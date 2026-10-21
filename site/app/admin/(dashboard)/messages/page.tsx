import { listerMessages } from "@/lib/messages";
import AdminMessageActions from "@/components/AdminMessageActions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  });
}

export default async function AdminMessagesPage() {
  const messages = await listerMessages();
  const nonTraites = messages.filter((m) => !m.traite).length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">
        Messages ({nonTraites} non traité{nonTraites !== 1 ? "s" : ""} sur {messages.length})
      </h1>

      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          Aucun message reçu pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                m.traite ? "border-gray-200 opacity-60" : "border-indigo-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.sujet}</p>
                  <p className="text-xs text-gray-500">
                    {m.nom ? `${m.nom} · ` : ""}
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.sujet}`)}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {m.email}
                    </a>
                    {" · "}
                    {formatDate(m.cree_le)}
                    {m.mail_envoye ? null : (
                      <span className="ml-1 font-medium text-amber-600">(mail non envoyé)</span>
                    )}
                  </p>
                </div>
                <AdminMessageActions id={m.id} traite={m.traite} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
