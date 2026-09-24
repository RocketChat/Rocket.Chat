import { createContext, useContext } from 'react';

import type { MessageListUserCard, MessageListViewer } from './messageListContract';
import { defaultMessageListViewer, inertMessageListUserCard } from './messageListContract';

export type MessageViewerContextValue = {
	viewer: MessageListViewer;
	userCard: MessageListUserCard;
};

export const MessageViewerContext = createContext<MessageViewerContextValue>({
	viewer: defaultMessageListViewer,
	userCard: inertMessageListUserCard,
});
MessageViewerContext.displayName = 'MessageViewer';

export const useMessageListViewer = (): MessageListViewer => useContext(MessageViewerContext).viewer;

export const useMessageListUserCard = (): MessageListUserCard => useContext(MessageViewerContext).userCard;
