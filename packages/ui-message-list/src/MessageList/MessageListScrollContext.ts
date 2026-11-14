import { createContext, useContext } from 'react';

import type { DateBubbleStore } from './scroll/dateBubbleStore';

export type MessageListScrollContextValue = {
	hasNewMessages: boolean;
	hasNewerMessages: boolean;
	dateBubbleStore: DateBubbleStore;
	/** How far down from the top of the list the consumer draws over it, in pixels. */
	overlayTopInset: number;
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
