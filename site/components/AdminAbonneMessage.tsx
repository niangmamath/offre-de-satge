"use client";

import { useRef, useState } from "react";

export default function AdminAbonneMessage({ id, email }: { id: number; email: string }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  function ouvrir() {
    setErreur("");
    setEnvoye(false);
    dialogue.current?.showModal();
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/admin/abonnes/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, sujet, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "L'envoi a échoué.");
        return;
      }
      setEnvoye(true);
      setSujet("");
      setMessage("");
    } catch {
      setErreur("L'envoi a échoué, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const champ =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
      >
        Envoyer un message
      </button>

      <dialog
        ref={dialogue}
        className="w-[min(92vw,32rem)] rounded-xl p-0 shadow-xl backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialogue.current) dialogue.current?.close(); // clic sur le fond
        }}
      >
        <form onSubmit={envoyer} className="flex flex-col gap-3 p-5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Message à un abonné</h2>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogue.current?.close()}
              aria-label="Fermer"
              className="text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {envoye ? (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              Message envoyé à {email}.
            </p>
          ) : (
            <>
              <input
                type="text"
                required
                maxLength={150}
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Objet"
                className={champ}
              />
              <textarea
                required
                rows={7}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message…"
                className={`${champ} resize-y`}
              />
              <p className="text-xs text-gray-400">
                Un bouton « Voir les offres » et le lien de désabonnement sont ajoutés automatiquement.
              </p>
              {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => dialogue.current?.close()}
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                >
                  {loading ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
