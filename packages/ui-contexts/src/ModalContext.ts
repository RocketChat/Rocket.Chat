import type { ReactNode } from 'react';
import { createContext } from 'react';

export type ModalContextValue = {
	modal: {
		setModal(modal: ReactNode): void;
	};
	currentModal: ReactNode;
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);
