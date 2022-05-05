import { useContext } from 'react';

import { ModalContext, ModalContextValue } from '../ModalContext';

export const useModal = (): ModalContextValue => useContext(ModalContext);
