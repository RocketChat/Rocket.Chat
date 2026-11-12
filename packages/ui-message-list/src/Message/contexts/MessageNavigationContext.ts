import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type MessageNavigationContextValue = {
	openRoom: (rid: IRoom['_id']) => void;
	openThread: (target: { rid: IRoom['_id']; tmid: IMessage['_id']; messageId?: IMessage['_id'] }) => void;
	jumpToMessage: (message: Pick<IMessage, '_id' | 'rid' | 'tmid'>) => void;
	getPermalink: (messageId: IMessage['_id']) => Promise<string>;
	openDirectMessage: (username: string) => void;
	/** Runs a legacy action link a message carries. */
	runActionLink: (message: IMessage, methodId: string) => void;
	openExternalLink: (url: string) => void;
};

const noop = () => undefined;

export const messageNavigationDefaultValue: MessageNavigationContextValue = {
	openRoom: noop,
	openThread: noop,
	jumpToMessage: noop,
	getPermalink: async (messageId) => `#${messageId}`,
	openDirectMessage: noop,
	runActionLink: noop,
	openExternalLink: (url) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	},
};

export const MessageNavigationContext = createContext<MessageNavigationContextValue>(messageNavigationDefaultValue);

export const useMessageNavigation = () => useContext(MessageNavigationContext);
