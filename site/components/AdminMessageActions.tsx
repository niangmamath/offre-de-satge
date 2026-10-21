"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminMessageActions({ id, traite }: { id: number; traite: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function basculer() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages/traiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, traite: !traite }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={loading}
      className={`text-xs font-medium disabled:opacity-50 ${
        traite ? "text-gray-500 hover:text-gray-800" : "text-emerald-700 hover:text-emerald-900"
      }`}
    >
      {traite ? "Marquer non traité" : "Marquer traité"}
    </button>
  );
}
