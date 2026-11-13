import { createContext } from 'react';

export type SurfaceContextValue = 'attachment' | 'banner' | 'message' | 'modal' | 'contextualBar' | 'home' | 'custom';

export const SurfaceContext = createContext<SurfaceContextValue>('message');
