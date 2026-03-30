import { useMessageListVirtualizer } from '../../../../components/message/list/MessageListContext';
import { useToggleSelectAll } from '../../MessageList/contexts/SelectedMessagesContext';

export const useSelectAllAndScrollToTop = () => {
	const virtualizerRef = useMessageListVirtualizer();
	const handleToggleAll = useToggleSelectAll();

	const selectAllAndScrollToTop = () => {
		virtualizerRef?.current?.scrollToOffset(0, { behavior: 'smooth' });
		handleToggleAll();
	};

	return { selectAllAndScrollToTop };
};
