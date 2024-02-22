import type { ReactNode } from 'react';
import { createContext } from 'react';

export type ModalContextValue = {
	modal: {
		setModal(modal?: ReactNode, region?: string): void;
	};
	currentModal: { component: ReactNode; region: string };
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);
