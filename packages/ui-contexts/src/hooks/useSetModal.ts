import type { ReactNode } from 'react';

import { useModal } from './useModal.js';

export const useSetModal = (): ((modal?: ReactNode) => void) => useModal().setModal;
