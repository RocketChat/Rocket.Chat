import type { ContextType, ReactNode } from 'react';

import { SurfaceContext } from '../contexts/SurfaceContext';

type SurfaceProps = {
	children: ReactNode;
	type: ContextType<typeof SurfaceContext>;
};

export const Surface = ({ children, type }: SurfaceProps) => <SurfaceContext.Provider value={type}>{children}</SurfaceContext.Provider>;
