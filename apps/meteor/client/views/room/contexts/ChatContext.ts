import { createContext, useContext } from 'react';

import type { ChatAPI } from '../../../lib/chats/ChatAPI';

type ChatContextValue = ChatAPI | undefined;

export const ChatContext = createContext<ChatContextValue>(undefined);

export const useChat = () => {
	const chat = useContext(ChatContext);
	if (!chat) {
		throw new Error('No ChatContext provided');
	}
	return chat;
};
