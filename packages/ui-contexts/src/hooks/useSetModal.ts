import type { ReactNode } from 'react';

import { useModal } from './useModal';

export const useSetModal = () => {
	const { setModal } = useModal();
	return (modal?: ReactNode) => setModal(modal);
};
