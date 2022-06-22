import { useContext } from 'react';

import { ModalContext, ModalContextValue } from '../ModalContext';

export const useModal = (): ModalContextValue => {
	const context = useContext(ModalContext);

	if (!context) {
		throw new Error('useModal must be used inside Modal Context');
	}

	return context;
};
