import { useContext } from 'react';

import type { LayoutContextValue } from '../LayoutContext.js';
import { LayoutContext } from '../LayoutContext.js';

export const useLayoutContextualBarPosition = (): LayoutContextValue['contextualBarPosition'] =>
	useContext(LayoutContext).contextualBarPosition;
