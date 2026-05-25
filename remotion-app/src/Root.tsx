import { Composition, getInputProps } from 'remotion';
import { Main } from './Main';
import { FPS, VIDEO_DURATION_FRAMES, WIDTH, HEIGHT } from './constants';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
