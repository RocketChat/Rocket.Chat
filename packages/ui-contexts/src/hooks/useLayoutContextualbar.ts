import { useContext } from 'react';

import type { LayoutContextValue } from '../LayoutContext';
import { LayoutContext } from '../LayoutContext';

export const useLayoutContextualbar = (): LayoutContextValue['contextualbar'] => useContext(LayoutContext).contextualbar;
