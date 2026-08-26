"use client";

import { useState } from "react";

export default function AdminTriggerButtons() {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function declencher(type: "scrape" | "newsletter") {
    setEnCours(type);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Erreur : ${data.error}`);
        return;
      }
      setMessage(
        type === "scrape"
          ? "Scraping lancé — compte ~1h30 à 2h, suivable dans l'onglet Actions de GitHub."
          : "Envoi de la newsletter lancé — suivable dans l'onglet Actions de GitHub."
      );
    } catch {
      setMessage("Une erreur est survenue, réessayez.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => declencher("scrape")}
          disabled={enCours !== null}
          className="rounded-full bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-50"
        >
          {enCours === "scrape" ? "Lancement…" : "Lancer le scraping maintenant"}
        </button>
        <button
          type="button"
          onClick={() => declencher("newsletter")}
          disabled={enCours !== null}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          {enCours === "newsletter" ? "Lancement…" : "Envoyer la newsletter maintenant"}
        </button>
      </div>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
    </div>
  );
}
