export const THEME = {
  fps: 30,
  width: 1080,
  height: 1920,
  colors: {
    bg: "#000000",
    primary: "#FFFFFF",
    accent: "#FFE600",
    neon: "#00F0FF",
    hot: "#FF2D55",
    shadow: "rgba(0,0,0,0.85)",
  },
  font: {
    // System-font stack first so the project renders offline; falls back to
    // Inter (loaded via @remotion/google-fonts in TikTokClip.tsx when online).
    family:
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    weightBold: "900",
    weightRegular: "700",
  },
  captions: {
    /** word card max width as a fraction of canvas */
    maxWidth: 0.86,
    fontSize: 110,
    lineHeight: 1.05,
    stroke: 14,
    bottomMargin: 360,
  },
} as const;
