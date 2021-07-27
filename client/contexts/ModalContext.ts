import { createContext, useContext, ReactNode } from 'react';

type ModalContextValue = unknown & {
	setModal: (modal: ReactNode) => void;
};

export const ModalContext = createContext<ModalContextValue>({
	setModal: () => undefined,
});

export const useModal = (): ModalContextValue => useContext(ModalContext);

export const useSetModal = (): ((modal?: ReactNode) => void) => useContext(ModalContext).setModal;
