import type { ReactNode } from 'react';
import { useContext } from 'react';

import { CurrentModalContext, ModalContext } from '../ModalContext';

/**
 * Similar to useModal this hook return the current modal from the context value
 */
export const useCurrentModal = (): ReactNode => {
	const context = useContext(ModalContext);
	const currentModal = useContext(CurrentModalContext);

	if (!context || !currentModal) {
		throw new Error('useCurrentModal must be used inside Modal Context');
	}

	if (currentModal.region !== context.region) {
		return null;
	}

	return currentModal.component;
};
