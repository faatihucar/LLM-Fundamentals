import React from 'react';
import {Composition, Folder} from 'remotion';
import {FPS, Main, SCENES, TOTAL} from './Main';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LLM-Temelleri" component={Main} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Folder name="Bolumler">
      {SCENES.map((s) => (
        <Composition key={s.id} id={s.id} component={s.Comp} durationInFrames={s.dur} fps={FPS} width={1920} height={1080} />
      ))}
    </Folder>
  </>
);
