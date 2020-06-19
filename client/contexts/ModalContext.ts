import { createContext, useContext } from 'react';

type ModalContextValue = unknown;

export const ModalContext = createContext<ModalContextValue>({});

export const useModal = (): ModalContextValue => useContext(ModalContext);
