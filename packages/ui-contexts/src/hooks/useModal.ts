import { useContext } from 'react';

import type { ModalContextValue } from '../ModalContext';
import { ModalContext } from '../ModalContext';

/**
 * Consider using useCurrentModal to get the current modal
 */
export const useModal = (): ModalContextValue['modal'] => {
	const context = useContext(ModalContext);

	if (!context) {
		return {
			setModal: () => undefined,
		};
	}

	return context.modal;
};
