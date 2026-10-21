"use client";

import { useState } from "react";
import { SUJETS_CONTACT, MESSAGE_MIN, MESSAGE_MAX } from "@/lib/contact";
import { CheckIcon } from "@/components/icons";

const champ =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

export default function ContactForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState<string>(SUJETS_CONTACT[0]);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // doit rester vide (piège à bots)
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, sujet, message, site_web: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue.");
        return;
      }
      setEnvoye(true);
    } catch {
      setErreur("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (envoye) {
    return (
      <p className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-medium text-emerald-700">
        <CheckIcon className="h-4 w-4 shrink-0" />
        Merci, votre message a bien été envoyé ! Nous vous répondrons à {email}.
      </p>
    );
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-4">
      <input
        type="text"
        name="site_web"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
          Nom <span className="text-xs text-gray-400">(facultatif)</span>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={100}
            className={champ}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className={champ}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Sujet
        <select value={sujet} onChange={(e) => setSujet(e.target.value)} className={champ}>
          {SUJETS_CONTACT.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Message
        <textarea
          required
          rows={6}
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Une idée pour améliorer le site, une offre erronée, une question…"
          className={`${champ} resize-y`}
        />
        <span className="self-end text-xs text-gray-400">
          {message.length}/{MESSAGE_MAX}
        </span>
      </label>
      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
      >
        {loading ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  );
}
