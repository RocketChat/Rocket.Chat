import { createContext, useContext } from 'react';

import type { ChatMessages } from '../../../../app/ui/client/lib/ChatMessages';
import { ChatAPI } from '../../../lib/chats/ChatAPI';

type ChatContextValue = (ChatMessages & ChatAPI) | undefined;

export const ChatContext = createContext<ChatContextValue>(undefined);

export const useChat = (): ChatContextValue => useContext(ChatContext);
