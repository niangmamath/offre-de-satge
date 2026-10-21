"use client";

import { useEffect, useRef, useState } from "react";

/** Liste déroulante à cases à cocher (sélection multiple). Aucun domaine
 * coché = tous domaines. */
export default function DomainesDropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);

  // Ferme au clic en dehors ou sur Échap.
  useEffect(() => {
    if (!ouvert) return;
    function clic(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false);
    }
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  const libelle =
    value.length === 0 ? "Tous domaines" : value.length === 1 ? value[0] : `${value.length} domaines`;

  function basculer(d: string) {
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  }

  return (
    <div ref={racine} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-52"
      >
        <span className="truncate">{libelle}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition ${ouvert ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {ouvert ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute bottom-full left-0 z-20 mb-1 w-full min-w-64 rounded-xl border border-gray-200 bg-white py-1 text-left shadow-lg"
        >
          <button
            type="button"
            onClick={() => onChange([])}
            className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
              value.length === 0 ? "font-semibold text-indigo-700" : "text-gray-700"
            }`}
          >
            Tous domaines
          </button>
          <div className="my-1 border-t border-gray-100" />
          {options.map((d) => (
            <label
              key={d}
              role="option"
              aria-selected={value.includes(d)}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={value.includes(d)}
                onChange={() => basculer(d)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {d}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
