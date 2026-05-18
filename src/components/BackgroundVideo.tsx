import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

/**
 * Renders the 9:16 cropped clip as the background layer.
 * The cropping is done upstream by ffmpeg in pipeline/crop.ts, so here
 * we just letterbox-fit to canvas and let the bottom 1/3 be partially
 * occluded by captions / overlays.
 */
export const BackgroundVideo: React.FC<{ src: string }> = ({ src }) => {
  const url = src.startsWith("http") || src.startsWith("/")
    ? src
    : staticFile(src);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={url}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Soft vignette to keep captions legible */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
