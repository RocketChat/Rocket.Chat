import { createContext, useContext } from 'react';

type SurfaceContextValue = 'attachment' | 'banner' | 'message' | 'modal';

export const SurfaceContext = createContext<SurfaceContextValue>('message');

export const useSurfaceType = (): SurfaceContextValue =>
  useContext(SurfaceContext);
