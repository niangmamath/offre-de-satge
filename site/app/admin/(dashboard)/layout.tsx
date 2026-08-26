import { redirect } from "next/navigation";
import Link from "next/link";
import { estAuthentifie } from "@/lib/admin";
import { CapIcon } from "@/components/icons";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await estAuthentifie())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-1.5 font-bold text-indigo-700">
              <CapIcon className="h-5 w-5" />
              Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link href="/admin" className="hover:text-indigo-700">
                Tableau de bord
              </Link>
              <Link href="/admin/offres" className="hover:text-indigo-700">
                Offres
              </Link>
              <Link href="/admin/abonnes" className="hover:text-indigo-700">
                Abonnés
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
              Voir le site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
