import { createContext, useContext } from 'react';

import type { MessageListDateBubble } from './scroll/useMessageListScroller';

export type MessageListScrollContextValue = {
	hasNewMessages: boolean;
	hasNewerMessages: boolean;
	isUserScrolling: boolean;
	dateBubble: MessageListDateBubble | undefined;
	scrollToBottom: () => void;
};

export const MessageListScrollContext = createContext<MessageListScrollContextValue | undefined>(undefined);

export const useMessageListScroll = () => {
	const context = useContext(MessageListScrollContext);
	if (!context) {
		throw new Error('The parts of a message list must be rendered inside a MessageList');
	}
	return context;
};
