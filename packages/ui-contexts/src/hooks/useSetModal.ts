import { ReactNode, useContext } from 'react';
import { ModalContext } from '@rocket.chat/ui-contexts';

export const useSetModal = (): ((modal?: ReactNode) => void) => useContext(ModalContext).setModal;
