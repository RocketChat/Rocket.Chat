import type { IMessage } from '@rocket.chat/core-typings';
import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

export type MessageInteractionsContextValue = {
	toggleReaction: (message: IMessage, reaction: string) => void;
	hasReacted: (message: IMessage, reaction: string) => boolean;
	openReactionPicker: (event: UIEvent, message: IMessage, options?: { onClose?: () => void }) => void;
	quote: (message: IMessage) => void;
	/** Quotes a message known only by its id in the composer, as an attachment button that responds with it does. */
	quoteMessageById: (messageId: IMessage['_id']) => void | Promise<void>;
	replyWith: (text: string) => void | Promise<void>;
	sendMessage: (text: string) => void | Promise<void>;
	replyBroadcast: (message: IMessage) => void;
	followThread: (message: IMessage) => void;
	unfollowThread: (message: IMessage) => void;
	openForward: (message: IMessage) => void;
};

const noop = () => undefined;

export const messageInteractionsDefaultValue: MessageInteractionsContextValue = {
	toggleReaction: noop,
	hasReacted: () => false,
	openReactionPicker: noop,
	quote: noop,
	quoteMessageById: noop,
	replyWith: noop,
	sendMessage: noop,
	replyBroadcast: noop,
	followThread: noop,
	unfollowThread: noop,
	openForward: noop,
};

export const MessageInteractionsContext = createContext<MessageInteractionsContextValue>(messageInteractionsDefaultValue);

export const useMessageInteractions = () => useContext(MessageInteractionsContext);
