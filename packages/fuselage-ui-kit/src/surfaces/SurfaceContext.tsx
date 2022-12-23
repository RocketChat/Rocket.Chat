import type { FC } from 'react';
import React, { createContext, useContext } from 'react';

export type SurfaceContextValue = {
  type: 'message' | 'modal' | 'banner';
};

export const SurfaceContext = createContext<SurfaceContextValue | undefined>(
  undefined
);

export const Surface: FC<{ value: SurfaceContextValue }> = (props) => (
  <SurfaceContext.Provider {...props} />
);

export const useSurface = (): SurfaceContextValue => {
  const context = useContext(SurfaceContext);
  if (!context) {
    throw new Error('Invalid Surface Content');
  }
  return context;
};

export const useSurfaceType = (): SurfaceContextValue['type'] => {
  const context = useSurface();
  return context.type;
};
