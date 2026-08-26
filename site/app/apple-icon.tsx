import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
          borderRadius: 40,
        }}
      >
        <svg width="104" height="104" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"
          />
          <path strokeLinecap="round" d="M21 8v6" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
