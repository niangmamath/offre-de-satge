"use client";

import { useState } from "react";

type Etape = "email" | "code" | "confirme" | "already";

export default function NewsletterForm() {
  const [etape, setEtape] = useState<Etape>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [honeypot, setHoneypot] = useState(""); // doit rester vide (piège à bots)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  async function envoyerEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, site_web: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue.");
        return;
      }
      if (data.status === "already_confirmed") {
        setEtape("already");
        setMessage("Cette adresse est déjà inscrite.");
      } else if (data.status === "reactivated") {
        setEtape("already");
        setMessage("Votre abonnement a été réactivé, bon retour !");
      } else {
        setEtape("code");
      }
    } catch {
      setErreur("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function verifierCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Code incorrect.");
        return;
      }
      setEtape("confirme");
      setMessage("Inscription confirmée — vous recevrez les nouvelles offres chaque semaine !");
    } catch {
      setErreur("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (etape === "confirme" || etape === "already") {
    return <p className="text-sm font-medium text-emerald-700">✓ {message}</p>;
  }

  if (etape === "code") {
    return (
      <form onSubmit={verifierCode} className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-500">
          Code envoyé à <span className="font-medium text-gray-700">{email}</span> (valable 15 min)
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            className="w-32 rounded-full border border-gray-300 px-4 py-2 text-center text-lg font-semibold tracking-[0.3em] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
          >
            {loading ? "…" : "Confirmer"}
          </button>
        </div>
        {erreur ? <p className="text-xs text-red-600">{erreur}</p> : null}
        <button
          type="button"
          onClick={() => setEtape("email")}
          className="text-xs text-gray-400 underline"
        >
          Mauvaise adresse ? Recommencer
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={envoyerEmail} className="flex flex-col items-center gap-2 sm:flex-row">
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
        disabled={loading}
        className="w-full shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60 sm:w-auto"
      >
        {loading ? "…" : "Recevoir les nouvelles offres"}
      </button>
      {erreur ? <p className="text-xs text-red-600 sm:ml-2">{erreur}</p> : null}
    </form>
  );
}
