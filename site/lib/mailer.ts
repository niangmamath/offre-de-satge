import nodemailer, { type Transporter } from "nodemailer";

// Singleton via globalThis, même raison que le Pool Postgres dans lib/db.ts
// (HMR en dev recrée le module sans redémarrer le process).
const globalForMail = globalThis as unknown as { _mailTransport?: Transporter };

/** null = variables SMTP absentes (pas encore configuré) — l'appelant doit
 * dégrader proprement, jamais planter la requête. */
export function getTransport(): Transporter | null {
  const host = process.env.SMTP_SERVER;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  if (!globalForMail._mailTransport) {
    const local = host.includes("localhost") || host.includes("127.0.0.1");
    globalForMail._mailTransport = nodemailer.createTransport({
      host,
      port,
      secure: false, // STARTTLS sur le port 587, pas TLS implicite (465)
      auth: { user, pass },
      // Un serveur SMTP de test local utilise un certificat auto-signé ; un
      // vrai fournisseur (Gmail...) a un certificat public valide, donc la
      // vérification stricte reste active partout ailleurs.
      tls: local ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalForMail._mailTransport;
}

export function fromAddress(): string {
  return process.env.FROM_EMAIL || process.env.SMTP_USER || "no-reply@example.com";
}

/** Logo "casquette de diplômé" en SVG inline pour les emails -- évite l'emoji
 * 🎓, dont le rendu (police système) varie trop d'un client mail à l'autre
 * pour un résultat cohérent. `color` doit correspondre à la couleur du texte
 * du titre à côté (blanc sur fond dégradé, indigo sur fond blanc). */
export function logoSvg(color: string, sizePx = 26): string {
  return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" style="vertical-align:middle;margin-right:8px;display:inline-block;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"/><path stroke-linecap="round" d="M21 8v6"/></svg>`;
}
