import { useContext } from 'react';

import type { SurfaceContextValue } from '../contexts/SurfaceContext.js';
import { SurfaceContext } from '../contexts/SurfaceContext.js';

export const useSurfaceType = (): SurfaceContextValue => useContext(SurfaceContext);
