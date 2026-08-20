import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <span className="text-5xl">🎉</span>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Inscription confirmée</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        Vous recevrez un email tous les 2 jours avec les nouvelles offres de stage au Maroc.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md"
      >
        Voir les offres
      </Link>
    </div>
  );
}
