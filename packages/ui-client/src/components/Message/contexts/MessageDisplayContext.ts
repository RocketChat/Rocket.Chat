import type { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type MessageHighlightWord = {
	highlight: string;
	regex: RegExp;
	urlRegex: RegExp;
};

export type MessageDisplayContextValue = {
	showRoles: boolean;
	showRealName: boolean;
	showUsername: boolean;
	showColors: boolean;
	showAvatars: boolean;
	readReceipts: { enabled: boolean; storeUsers: boolean };
	/** Whether URL previews and embeds are shown. */
	embedsEnabled: boolean;
	highlights?: MessageHighlightWord[];
	katex?: { dollarSyntaxEnabled: boolean; parenthesisSyntaxEnabled: boolean };
	autoLinkDomains: string;
	formatTime: (date: Date) => string;
	formatDate: (date: Date) => string;
	formatDateAndTime: (date: Date) => string;
	isTranslated: (message: IMessage) => boolean;
	isStarred: (message: IMessage) => boolean;
	isFollowing: (message: IMessage) => boolean;
	/**
	 * Whether the viewer can act on messages here. Read-only places, such as audits and moderation, show messages without
	 * their toolbar or thread metrics.
	 */
	allowsInteraction: boolean;
};

const timeFormat = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });
const dateAndTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' });

export const messageDisplayDefaultValue: MessageDisplayContextValue = {
	showRoles: false,
	showRealName: false,
	showUsername: false,
	showColors: false,
	showAvatars: true,
	readReceipts: { enabled: false, storeUsers: false },
	embedsEnabled: false,
	autoLinkDomains: '',
	formatTime: (date) => timeFormat.format(date),
	formatDate: (date) => dateFormat.format(date),
	formatDateAndTime: (date) => dateAndTimeFormat.format(date),
	isTranslated: () => false,
	isStarred: () => false,
	isFollowing: () => false,
	allowsInteraction: true,
};

export const MessageDisplayContext = createContext<MessageDisplayContextValue>(messageDisplayDefaultValue);

export const useMessageDisplay = () => useContext(MessageDisplayContext);
