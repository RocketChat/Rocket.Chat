import type { ReactNode } from 'react';
import React from 'react';

import BannerSurface from './BannerSurface';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { SurfaceOptions } from './constant';

const SurfaceRender = ({
  type,
  children,
}: {
  type: SurfaceOptions,
  children: ReactNode,
}) => (
  <>
    {SurfaceOptions.Message === type && (
      <MessageSurface>{children}</MessageSurface>
    )}
    {SurfaceOptions.Banner === type && (
      <BannerSurface>{children}</BannerSurface>
    )}
    {SurfaceOptions.Modal === type && <ModalSurface>{children}</ModalSurface>}
  </>
);
export default SurfaceRender;
