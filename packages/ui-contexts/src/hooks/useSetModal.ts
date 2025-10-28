import type { ReactNode } from 'react';

import { useModal } from './useModal';

export const useSetModal = (): ((modal?: ReactNode) => void) => useModal().setModal;
