"use client";

import { useState } from "react";

type Etat = "idle" | "loading" | "success" | "already" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // doit rester vide (piège à bots)
  const [etat, setEtat] = useState<Etat>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEtat("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, site_web: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEtat("error");
        setMessage(data.error || "Une erreur est survenue.");
        return;
      }
      if (data.status === "already_confirmed") {
        setEtat("already");
        setMessage("Cette adresse est déjà inscrite.");
      } else if (data.status === "reactivated") {
        setEtat("already");
        setMessage("Votre abonnement a été réactivé, bon retour !");
      } else {
        setEtat("success");
        setMessage("Vérifiez votre boîte mail pour confirmer votre inscription.");
      }
    } catch {
      setEtat("error");
      setMessage("Une erreur est survenue, réessayez.");
    }
  }

  if (etat === "success" || etat === "already") {
    return <p className="text-sm font-medium text-emerald-700">✓ {message}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-center gap-2 sm:flex-row">
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
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.com"
        className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-64"
      />
      <button
        type="submit"
        disabled={etat === "loading"}
        className="w-full shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60 sm:w-auto"
      >
        {etat === "loading" ? "…" : "Recevoir les nouvelles offres"}
      </button>
      {etat === "error" ? <p className="text-xs text-red-600 sm:ml-2">{message}</p> : null}
    </form>
  );
}
