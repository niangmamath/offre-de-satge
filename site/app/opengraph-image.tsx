import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #a21caf 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <svg
          width="128"
          height="128"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.4}
          style={{ marginBottom: 12 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"
          />
          <path strokeLinecap="round" d="M21 8v6" />
        </svg>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -1, display: "flex" }}>
          Stages au Maroc
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: 24,
            color: "rgba(255,255,255,0.88)",
            display: "flex",
          }}
        >
          Toutes les offres de stage, tous domaines, mises à jour en continu
        </div>
      </div>
    ),
    { ...size }
  );
}
