import { useContext } from 'react';

import { LayoutContext, LayoutContextValue } from '../LayoutContext';

export const useLayoutContextualBarPosition = (): LayoutContextValue['contextualBarPosition'] =>
	useContext(LayoutContext).contextualBarPosition;
