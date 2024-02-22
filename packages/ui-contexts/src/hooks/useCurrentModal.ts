import { useContext } from 'react';

import type { ModalContextValue } from '../ModalContext';
import { ModalContext } from '../ModalContext';

/**
 * Similar to useModal this hook return the current modal from the context value
 */
export const useCurrentModal = (region: string): ModalContextValue['currentModal']['component'] => {
	const context = useContext(ModalContext);

	if (!context) {
		throw new Error('useCurrentModal must be used inside Modal Context');
	}

	if (context.currentModal.region !== region) {
		return null;
	}

	return context.currentModal.component;
};
