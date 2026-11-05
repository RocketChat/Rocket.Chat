import type { IMessage } from '@rocket.chat/core-typings';
import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

export type MessageInteractionsContextValue = {
	toggleReaction: (message: IMessage, reaction: string) => void;
	hasReacted: (message: IMessage, reaction: string) => boolean;
	openReactionPicker: (event: UIEvent, message: IMessage) => void;
	quote: (message: IMessage) => void;
	replyWith: (text: string) => void;
	sendMessage: (text: string) => void;
	edit: (message: IMessage) => void;
	canDelete: (message: IMessage) => boolean;
	requestDeletion: (message: IMessage) => void;
	replyBroadcast: (message: IMessage) => void;
	pin: (message: IMessage) => void;
	unpin: (message: IMessage) => void;
	star: (message: IMessage) => void;
	unstar: (message: IMessage) => void;
	followThread: (message: IMessage) => void;
	unfollowThread: (message: IMessage) => void;
	markUnread: (message: IMessage) => void;
	translate: (message: IMessage) => void;
	showOriginal: (message: IMessage) => void;
	openForward: (message: IMessage) => void;
	openReport: (message: IMessage) => void;
	openReactionList: (message: IMessage) => void;
	openReadReceipts: (message: IMessage) => void;
	startDiscussion: (message: IMessage) => void;
};

const noop = () => undefined;

export const messageInteractionsDefaultValue: MessageInteractionsContextValue = {
	toggleReaction: noop,
	hasReacted: () => false,
	openReactionPicker: noop,
	quote: noop,
	replyWith: noop,
	sendMessage: noop,
	edit: noop,
	canDelete: () => false,
	requestDeletion: noop,
	replyBroadcast: noop,
	pin: noop,
	unpin: noop,
	star: noop,
	unstar: noop,
	followThread: noop,
	unfollowThread: noop,
	markUnread: noop,
	translate: noop,
	showOriginal: noop,
	openForward: noop,
	openReport: noop,
	openReactionList: noop,
	openReadReceipts: noop,
	startDiscussion: noop,
};

export const MessageInteractionsContext = createContext<MessageInteractionsContextValue>(messageInteractionsDefaultValue);

export const useMessageInteractions = () => useContext(MessageInteractionsContext);
