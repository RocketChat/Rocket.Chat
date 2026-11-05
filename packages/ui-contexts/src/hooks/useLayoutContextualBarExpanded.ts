import { useContext } from 'react';

import { LayoutContext } from '../LayoutContext.js';

export const useLayoutContextualBarExpanded = (): boolean => useContext(LayoutContext).contextualBarExpanded;
