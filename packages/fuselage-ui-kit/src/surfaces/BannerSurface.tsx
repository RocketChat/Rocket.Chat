import type { ReactNode } from 'react';

import { Surface } from './Surface.js';

export type BannerSurfaceProps = {
	children?: ReactNode;
};

const BannerSurface = ({ children }: BannerSurfaceProps) => <Surface type='banner'>{children}</Surface>;

export default BannerSurface;
