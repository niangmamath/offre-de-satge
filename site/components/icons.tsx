// Icônes maison en SVG (mêmes conventions que le SearchIcon déjà utilisé
// dans OffresExplorer.tsx : viewBox 24x24, stroke currentColor). Remplacent
// les emojis, dont le rendu varie trop d'une plateforme à l'autre (police
// d'emoji du système, "stickers" Windows/Apple/Android différents) pour un
// résultat cohérent sur le site.

type IconProps = { className?: string };

export function CapIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"
      />
      <path strokeLinecap="round" d="M21 8v6" />
    </svg>
  );
}

export function MailboxIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function CoinIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 15c0 1.1 1.12 2 2.5 2s2.5-.9 2.5-2-1.12-1.8-2.5-2-2.5-.9-2.5-2 1.12-2 2.5-2 2.5.9 2.5 2"
      />
      <path strokeLinecap="round" d="M12 6.5v1M12 16.5v1" />
    </svg>
  );
}

export function CheckIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function MonitorIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function GearIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
      />
    </svg>
  );
}

export function TruckIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="8" width="12" height="8" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11h3.5l3 3v2H19" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function ChartUpIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15l4-4 3 3 6-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 8H18v4.5" />
    </svg>
  );
}

export function UsersIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
      <circle cx="17" cy="9" r="2.4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.2 20c.2-2.3 1.7-4.2 3.8-4.9" />
    </svg>
  );
}

export function ScaleIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M12 3v16" />
      <path strokeLinecap="round" d="M8 20h8" />
      <path strokeLinecap="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l-2 5.5a2.5 2.5 0 005 0L4 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-2 5.5a2.5 2.5 0 005 0L20 7z" />
    </svg>
  );
}

export function MedicalIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CircleCheckIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

export function AlertIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7.5v5.5" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l1.8 6.2 6.2 1.8-6.2 1.8L12 21.5l-1.8-6.2-6.2-1.8 6.2-1.8L12 2.5z" />
    </svg>
  );
}
