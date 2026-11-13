import type { ReactNode } from 'react';

import { Surface } from './Surface';

export type HomeSurfaceProps = {
	children?: ReactNode;
};

const HomeSurface = ({ children }: HomeSurfaceProps) => <Surface type='home'>{children}</Surface>;

export default HomeSurface;
