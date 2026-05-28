import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { CaptionTrack2 } from './components/CaptionTrack2';
import { LogoOverlayTrack2 } from './components/LogoOverlayTrack2';
import { ZoomTrack } from './components/ZoomTrack';

// Pulses synced with hooks / brand reveals of the Gemini Harmony video
const PULSES_V2 = [
  { start: 0.5,  duration: 1.6, scale: 1.12 }, // Opening "Google" hook
  { start: 17.8, duration: 1.6, scale: 1.10 }, // "vidéo complète"
  { start: 22.0, duration: 1.8, scale: 1.12 }, // "Gemini Harmony" reveal
  { start: 27.4, duration: 1.4, scale: 1.10 }, // "révolution"
  { start: 41.5, duration: 1.6, scale: 1.10 }, // "nouvelle interface Gemini"
  { start: 65.4, duration: 1.4, scale: 1.12 }, // "Wow extraordinaire"
  { start: 76.0, duration: 2.0, scale: 1.10 }, // outro CTA energy
];

const SHAKES_V2 = [
  { start: 0.5,  duration: 0.4, intensity: 6 },
  { start: 22.2, duration: 0.4, intensity: 6 },
  { start: 27.5, duration: 0.4, intensity: 5 },
  { start: 65.5, duration: 0.4, intensity: 6 },
  { start: 76.0, duration: 0.5, intensity: 7 },
];
import { SfxTrack2 } from './components/SfxTrack2';
import { HookOverlay2 } from './components/HookOverlay2';
import { ProgressBar2 } from './components/ProgressBar2';
import { VignetteAndGrain } from './components/VignetteAndGrain';
import { ParticlesTrack } from './components/ParticlesTrack';
import { BRollTrack2 } from './components/BRollTrack2';
import { SubscribeCTA2 } from './components/SubscribeCTA2';

export const Main2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ZoomTrack pulses={PULSES_V2} shakes={SHAKES_V2}>
        <OffthreadVideo
          src={staticFile('source2.mp4')}
          volume={1}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </ZoomTrack>

      <VignetteAndGrain />

      <BRollTrack2 />

      <ParticlesTrack />

      <LogoOverlayTrack2 />

      <HookOverlay2 />

      <SubscribeCTA2 />

      <CaptionTrack2 />

      <ProgressBar2 />

      <SfxTrack2 />
    </AbsoluteFill>
  );
};
