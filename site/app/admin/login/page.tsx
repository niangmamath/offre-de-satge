"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CapIcon } from "@/components/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasse }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Échec de connexion.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setErreur("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-indigo-700">
          <CapIcon className="h-7 w-7" />
          <span className="text-lg font-bold">Administration</span>
        </div>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="Mot de passe"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
          <button
            type="submit"
            disabled={loading || !motDePasse}
            className="mt-1 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
