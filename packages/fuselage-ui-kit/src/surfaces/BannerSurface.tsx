import { Margins } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import { Surface } from './Surface';

type BannerSurfaceProps = {
  children?: ReactNode;
};

const BannerSurface = ({ children }: BannerSurfaceProps): ReactElement => (
  <Surface type='banner'>
    <Margins block='x8'>{children}</Margins>
  </Surface>
);

export default BannerSurface;
