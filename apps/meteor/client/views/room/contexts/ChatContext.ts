import { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { ChatMessages } from '../../../../app/ui/client';

/** Replacement API for `ChatMessages` fully decoupled and stateless */
export type ChatAPI = {
	readonly composer: {
		readonly replyWith: (text: string) => Promise<void>;
		readonly quoteMessage: (message: IMessage) => Promise<void>;
		readonly dismissQuotedMessage: (mid: IMessage['_id']) => Promise<void>;
		dismissAllQuotedMessages: () => Promise<void>;
		readonly quotedMessages: {
			get: () => IMessage[];
			subscribe: (callback: () => void) => () => void;
		};
	};
	readonly allMessages: {
		findOneByID: (mid: IMessage['_id']) => Promise<IMessage | undefined>;
		getOneByID: (mid: IMessage['_id']) => Promise<IMessage>;
	};
	readonly sendMessage: (text: string) => Promise<void>;
	readonly uploadFiles: (files: readonly File[]) => Promise<void>;
};

type ChatContextValue = (ChatMessages & ChatAPI) | undefined;

export const ChatContext = createContext<ChatContextValue>(undefined);

export const useChat = (): ChatContextValue => useContext(ChatContext);
