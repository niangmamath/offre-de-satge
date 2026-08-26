"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminOffreActions({ url, masque }: { url: string; masque: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleMasque() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offres/masquer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, masque: !masque }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function supprimer() {
    if (!window.confirm("Supprimer définitivement cette offre ?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offres/supprimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-3 text-xs font-medium">
      <button
        type="button"
        onClick={toggleMasque}
        disabled={loading}
        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
      >
        {masque ? "Afficher" : "Masquer"}
      </button>
      <button
        type="button"
        onClick={supprimer}
        disabled={loading}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}
