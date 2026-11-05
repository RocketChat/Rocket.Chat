import type { ReactNode } from 'react';

import { Surface } from './Surface.js';

export type ContextualBarSurfaceProps = {
	children?: ReactNode;
};

const ContextualBarSurface = ({ children }: ContextualBarSurfaceProps) => <Surface type='contextualBar'>{children}</Surface>;

export default ContextualBarSurface;
