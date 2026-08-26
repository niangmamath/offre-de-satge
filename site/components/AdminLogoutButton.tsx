"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function deconnexion() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deconnexion}
      className="text-sm font-medium text-gray-500 hover:text-gray-800"
    >
      Déconnexion
    </button>
  );
}
