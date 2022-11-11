import type { ContextType, ReactElement, ReactNode } from 'react';
import React from 'react';

import { SurfaceContext } from '../contexts/SurfaceContext';

type SurfaceProps = {
  children: ReactNode;
  type: ContextType<typeof SurfaceContext>;
};

export const Surface = ({ children, type }: SurfaceProps): ReactElement => (
  <SurfaceContext.Provider value={type}>{children}</SurfaceContext.Provider>
);
