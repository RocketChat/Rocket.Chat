import type { RefObject } from 'react';

import type { VirtualizerHandle } from '../../MessageList/VirtualizedMessageList';
import { useToggleSelectAll } from '../../MessageList/contexts/SelectedMessagesContext';

export const useSelectAllAndScrollToTop = (virtualizerRef: RefObject<VirtualizerHandle>) => {
	const handleToggleAll = useToggleSelectAll();

	const selectAllAndScrollToTop = () => {
		virtualizerRef?.current?.scrollToOffset(0, { behavior: 'smooth' });
		handleToggleAll();
	};

	return { selectAllAndScrollToTop };
};
