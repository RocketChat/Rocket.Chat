import type { ReactNode } from 'react';

import BannerSurface from './BannerSurface';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { SurfaceOptions } from './constant';
import ContextualBarSurface from './ContextualBarSurface';

const SurfaceRender = ({
  type = SurfaceOptions.Message,
  children,
}: {
  type?: SurfaceOptions;
  children: ReactNode;
}) => (
  <>
    {SurfaceOptions.Message === type && (
      <MessageSurface>{children}</MessageSurface>
    )}
    {SurfaceOptions.Banner === type && (
      <BannerSurface>{children}</BannerSurface>
    )}
    {SurfaceOptions.Modal === type && <ModalSurface>{children}</ModalSurface>}
    {SurfaceOptions.ContextualBar === type && (
      <ContextualBarSurface>{children}</ContextualBarSurface>
    )}
  </>
);
export default SurfaceRender;
