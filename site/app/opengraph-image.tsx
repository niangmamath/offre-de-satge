import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// De nombreux clients (WhatsApp, Telegram, Discord...) recadrent cette image
// en CARRÉ pour la vignette du lien, puis l'affichent en tout petit dans la
// conversation -- tout texte hors de la zone carrée centrale (285-915px en
// largeur, soit 630x630 au centre du canevas 1200x630) est coupé, et un
// sous-titre trop fin devient illisible une fois réduit à cette taille.
// Solution : un seul élément fort (logo + nom, gros et gras) centré dans
// cette zone sûre -- la description détaillée est déjà fournie séparément
// par la balise <meta name="description"> (app/layout.tsx), affichée par
// WhatsApp à côté de la vignette, donc pas besoin de la répéter ici.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #a21caf 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 630,
            height: 630,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"
            />
            <path strokeLinecap="round" d="M21 8v6" />
          </svg>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -1,
              marginTop: 20,
              display: "flex",
              textAlign: "center",
            }}
          >
            Stages au Maroc
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
