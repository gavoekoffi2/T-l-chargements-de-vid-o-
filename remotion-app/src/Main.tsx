import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { CaptionTrack } from './components/CaptionTrack';
import { LogoOverlayTrack } from './components/LogoOverlayTrack';
import { ZoomTrack } from './components/ZoomTrack';
import { SfxTrack } from './components/SfxTrack';
import { HookOverlay } from './components/HookOverlay';
import { LevelBadgeTrack } from './components/LevelBadgeTrack';
import { ProgressBar } from './components/ProgressBar';
import { VignetteAndGrain } from './components/VignetteAndGrain';
import { ParticlesTrack } from './components/ParticlesTrack';
import { BRollTrack } from './components/BRollTrack';
import { SubscribeCTA } from './components/SubscribeCTA';

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Video + camera-style zoom container */}
      <ZoomTrack>
        <OffthreadVideo
          src={staticFile('source.mp4')}
          volume={1}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </ZoomTrack>

      {/* Subtle grain + vignette for cinematic feel */}
      <VignetteAndGrain />

      {/* B-Rolls: fullscreen motion-graphics cutaways (above video, below text) */}
      <BRollTrack />

      {/* Particles / motion-design ambient */}
      <ParticlesTrack />

      {/* Level number badges that pop in at each "niveau N" */}
      <LevelBadgeTrack />

      {/* AI tool logos with whoosh sfx */}
      <LogoOverlayTrack />

      {/* Hook captions at the very beginning */}
      <HookOverlay />

      {/* Subscribe CTAs (mini + full end-screen) */}
      <SubscribeCTA />

      {/* Word-by-word TikTok captions */}
      <CaptionTrack />

      {/* Top progress bar */}
      <ProgressBar />

      {/* All sound effects synchronized */}
      <SfxTrack />
    </AbsoluteFill>
  );
};
