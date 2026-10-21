import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { CapIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une idée pour améliorer Stages au Maroc, un problème à signaler ou une question ? Écrivez-nous.",
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
          >
            <CapIcon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            Stages au Maroc
          </Link>
          <p className="mt-1 text-sm text-indigo-100">
            Une idée d&apos;amélioration, un problème, une question ? Écrivez-nous.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <ContactForm />
        </div>
        <Link href="/" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
          ← Retour aux offres
        </Link>
      </main>
    </div>
  );
}
