import { createContext, useContext, useSyncExternalStore } from 'react';

import type { ChatAPI, ComposerAPI } from '../../../lib/chats/ChatAPI';

type ChatContextValue = ChatAPI | undefined;

export const ChatContext = createContext<ChatContextValue>(undefined);

export const useChat = (): ChatContextValue => useContext(ChatContext);

const subscribeToNothing = () => () => undefined;

/** The composer of the chat, rendering again when it registers or goes away. */
export const useChatComposer = (): ComposerAPI | undefined => {
	const chat = useChat();
	return useSyncExternalStore(chat?.subscribeToComposer ?? subscribeToNothing, () => chat?.composer);
};
