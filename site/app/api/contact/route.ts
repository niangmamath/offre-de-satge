import { NextResponse } from "next/server";
import { getTransport, fromAddress, logoSvg } from "@/lib/mailer";
import { SUJETS_CONTACT, MESSAGE_MIN, MESSAGE_MAX } from "@/lib/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Limite best-effort par instance serverless (la mémoire n'est pas partagée
// entre instances Vercel) : suffit à freiner un formulaire soumis en boucle,
// le honeypot filtre déjà la plupart des bots.
const FENETRE_MS = 60 * 60 * 1000;
const MAX_PAR_FENETRE = 5;
const envoisParIp = new Map<string, number[]>();

function tropDEnvois(ip: string): boolean {
  const maintenant = Date.now();
  const recents = (envoisParIp.get(ip) ?? []).filter((t) => maintenant - t < FENETRE_MS);
  if (recents.length >= MAX_PAR_FENETRE) {
    envoisParIp.set(ip, recents);
    return true;
  }
  recents.push(maintenant);
  envoisParIp.set(ip, recents);
  return false;
}

function echapper(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Même honeypot ("site_web") que /api/subscribe : rempli => bot, on répond
// "ok" sans rien envoyer pour ne pas révéler le piège.
export async function POST(request: Request) {
  let body: { nom?: string; email?: string; sujet?: string; message?: string; site_web?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (body.site_web) {
    return NextResponse.json({ status: "ok" });
  }

  const nom = (body.nom || "").trim().slice(0, 100);
  const email = (body.email || "").trim();
  const sujet = SUJETS_CONTACT.includes(body.sujet as (typeof SUJETS_CONTACT)[number])
    ? (body.sujet as string)
    : "Autre";
  const message = (body.message || "").trim();

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  }
  if (message.length < MESSAGE_MIN) {
    return NextResponse.json({ error: "Votre message est trop court." }, { status: 400 });
  }
  if (message.length > MESSAGE_MAX) {
    return NextResponse.json(
      { error: `Votre message dépasse ${MESSAGE_MAX} caractères.` },
      { status: 400 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  if (tropDEnvois(ip)) {
    return NextResponse.json(
      { error: "Trop de messages envoyés, réessayez dans une heure." },
      { status: 429 }
    );
  }

  const transport = getTransport();
  if (!transport) {
    console.warn("[contact] SMTP non configuré — message non transmis.");
    return NextResponse.json({ error: "Service indisponible, réessayez plus tard" }, { status: 503 });
  }

  const destinataire = process.env.CONTACT_EMAIL || fromAddress();
  try {
    await transport.sendMail({
      from: fromAddress(),
      to: destinataire,
      // Répondre au mail reçu répond directement au visiteur.
      replyTo: nom ? `"${nom.replace(/"/g, "")}" <${email}>` : email,
      subject: `[Contact] ${sujet}${nom ? ` — ${nom}` : ""}`,
      text: `De : ${nom || "(nom non renseigné)"} <${email}>\nSujet : ${sujet}\n\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#4338ca;">${logoSvg("#4338ca")}Stages au Maroc — message d'un visiteur</h2>
          <p style="color:#444;font-size:14px;margin:0 0 4px;"><strong>Sujet :</strong> ${echapper(sujet)}</p>
          <p style="color:#444;font-size:14px;margin:0 0 16px;"><strong>De :</strong> ${echapper(nom || "(nom non renseigné)")} &lt;${echapper(email)}&gt;</p>
          <div style="white-space:pre-wrap;border-left:3px solid #c7d2fe;padding:8px 14px;color:#222;font-size:14px;">${echapper(message)}</div>
          <p style="color:#999;font-size:12px;margin-top:20px;">Répondez directement à ce mail pour écrire au visiteur.</p>
        </div>`,
    });
  } catch (e) {
    console.error("[contact] échec envoi:", e);
    return NextResponse.json(
      { error: "Le message n'a pas pu être envoyé, réessayez plus tard." },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
