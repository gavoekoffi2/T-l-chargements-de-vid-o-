import { Composition } from 'remotion';
import { Main } from './Main';
import { Main2 } from './Main2';
import { FPS, VIDEO_DURATION_FRAMES, WIDTH, HEIGHT } from './constants';
import {
  FPS as FPS2,
  VIDEO_DURATION_FRAMES as DUR2,
  WIDTH as W2,
  HEIGHT as H2,
} from './constants2';

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
      <Composition
        id="Main2"
        component={Main2}
        durationInFrames={DUR2}
        fps={FPS2}
        width={W2}
        height={H2}
      />
    </>
  );
};
