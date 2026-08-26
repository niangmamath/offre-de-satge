import AdminOffreForm from "@/components/AdminOffreForm";

export default function NouvelleOffrePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Ajouter une offre</h1>
      <p className="text-xs text-gray-500">
        Cette offre ne sera jamais touchée par le scraping automatique (ajoutée/retirée
        uniquement par vous, ici).
      </p>
      <AdminOffreForm />
    </div>
  );
}
