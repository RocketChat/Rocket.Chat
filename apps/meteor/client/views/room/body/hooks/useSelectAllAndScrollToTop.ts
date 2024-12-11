import { useRef } from 'react';

import { useToggleSelectAll } from '../../MessageList/contexts/SelectedMessagesContext';

export const useSelectAllAndScrollToTop = () => {
	const ref = useRef<HTMLElement>(null);
	const handleToggleAll = useToggleSelectAll();

	const selectAllAndScrollToTop = () => {
		ref.current?.scrollTo({ top: 0, behavior: 'smooth' });
		handleToggleAll();
	};

	return { innerRef: ref, selectAllAndScrollToTop };
};
