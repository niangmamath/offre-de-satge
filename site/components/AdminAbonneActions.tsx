"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAbonneActions({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function desabonner() {
    if (!window.confirm("Désabonner cette adresse ?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/abonnes/desabonner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={desabonner}
      disabled={loading}
      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      Désabonner
    </button>
  );
}
