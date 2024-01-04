import { createContext } from 'react';

export type SurfaceContextValue =
  | 'attachment'
  | 'banner'
  | 'message'
  | 'modal'
  | 'contextualBar';

export const SurfaceContext = createContext<SurfaceContextValue>('message');
