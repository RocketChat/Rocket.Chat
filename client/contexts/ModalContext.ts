import { createContext, useContext, ReactNode } from 'react';

import { modal } from '../../app/ui-utils/client';

type ModalContextValue = typeof modal & {
	setModal: (modal: ReactNode) => void;
};

export const ModalContext = createContext<ModalContextValue>(
	Object.assign(modal, {
		setModal: () => undefined,
	}),
);

export const useModal = (): ModalContextValue => useContext(ModalContext);

export const useSetModal = (): ((modal?: ReactNode) => void) => useContext(ModalContext).setModal;
