import { useContext } from 'react';
import { ModalContext, ModalContextValue } from '@rocket.chat/ui-contexts';

export const useModal = (): ModalContextValue => useContext(ModalContext);
