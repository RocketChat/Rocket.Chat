import { ReactNode, useContext } from 'react';

import { ModalContext } from '../ModalContext';

export const useSetModal = (): ((modal?: ReactNode) => void) => useContext(ModalContext).setModal;
