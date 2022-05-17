import { useContext } from 'react';

import { LayoutContext } from '../LayoutContext';

export const useLayoutContextualBarExpanded = (): boolean => useContext(LayoutContext).contextualBarExpanded;
