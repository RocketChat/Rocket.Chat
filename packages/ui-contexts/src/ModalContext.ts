import type { ReactNode } from 'react';
import { createContext } from 'react';

/** Stable for the provider's lifetime, so opening or closing a modal does not re-render the components that only open them. */
export type ModalContextValue = {
	modal: {
		setModal(modal?: ReactNode): void;
	};
	region?: symbol;
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

ModalContext.displayName = 'ModalContext';

export type CurrentModalContextValue = { component: ReactNode; region?: symbol };

export const CurrentModalContext = createContext<CurrentModalContextValue | undefined>(undefined);

CurrentModalContext.displayName = 'CurrentModalContext';
