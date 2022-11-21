import { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { ChatMessages } from '../../../../app/ui/client';

export type ChatAPI = {
	readonly sendMessage: (text: string) => Promise<void>;
	readonly composer: {
		readonly replyWith: (text: string) => Promise<void>;
		readonly quoteMessage: (message: IMessage) => Promise<void>;
	};
	readonly allMessages: {
		findOneByID: (mid: IMessage['_id']) => Promise<IMessage | undefined>;
		getOneByID: (mid: IMessage['_id']) => Promise<IMessage>;
	};
};

type ChatContextValue = (ChatMessages & ChatAPI) | undefined;

export const ChatContext = createContext<ChatContextValue>(undefined);

export const useChat = (): ChatContextValue => useContext(ChatContext);
