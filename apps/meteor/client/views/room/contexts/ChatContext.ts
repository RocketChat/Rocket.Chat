import { createContext, useContext } from 'react';

import type { ChatAPI } from '../../../lib/chats/ChatAPI';

type ChatContextValue = ChatAPI | undefined;

export const ChatContext = createContext<ChatContextValue>(undefined);

export const useChat = (): ChatContextValue => useContext(ChatContext);
