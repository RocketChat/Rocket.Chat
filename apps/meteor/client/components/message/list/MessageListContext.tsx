import type { IMessage } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { useFormatDate } from '../../../hooks/useFormatDate';
import type { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import type { useFormatTime } from '../../../hooks/useFormatTime';

export type MessageListContextValue = {
	autoTranslate: {
		showAutoTranslate: (message: IMessage) => boolean;
		autoTranslateLanguage?: string;
		autoTranslateEnabled: boolean;
	};
	autoLinkDomains: string;
	showRoles: boolean;
	getMessageRoles: (userId: string) => string[];
	showUsername: boolean;
	highlights?: {
		highlight: string;
		regex: RegExp;
		urlRegex: RegExp;
	}[];
	katex?: {
		dollarSyntaxEnabled: boolean;
		parenthesisSyntaxEnabled: boolean;
	};
	autoTranslateLanguage?: string;
	showColors: boolean;
	jumpToMessageParam?: string;
	apiEmbedEnabled: boolean;
	readReceipts: {
		enabled: boolean;
		storeUsers: boolean;
	};
	formatDateAndTime: ReturnType<typeof useFormatDateAndTime>;
	formatTime: ReturnType<typeof useFormatTime>;
	formatDate: ReturnType<typeof useFormatDate>;
	subscribed: boolean;
	broadcast: boolean;
	chatAvailable: boolean;
};

export const messageListContextDefaultValue: MessageListContextValue = {
	autoTranslate: {
		showAutoTranslate: () => false,
		autoTranslateLanguage: undefined,
		autoTranslateEnabled: false,
	},
	showRoles: false,
	getMessageRoles: () => [],
	showUsername: false,
	showColors: false,
	apiEmbedEnabled: false,
	readReceipts: {
		enabled: false,
		storeUsers: false,
	},
	autoLinkDomains: '',
	formatDateAndTime: () => '',
	formatTime: () => '',
	formatDate: () => '',
	subscribed: false,
	broadcast: false,
	chatAvailable: false,
};

export const MessageListContext = createContext<MessageListContextValue>(messageListContextDefaultValue);

export const useShowTranslated: MessageListContextValue['autoTranslate']['showAutoTranslate'] = (...args) =>
	useContext(MessageListContext).autoTranslate.showAutoTranslate(...args);
export const useMessageListShowRoles = (): MessageListContextValue['showRoles'] => useContext(MessageListContext).showRoles;
export const useMessageListRoles = (userId: string): string[] => useContext(MessageListContext).getMessageRoles(userId);
export const useMessageListShowUsername = (): MessageListContextValue['showUsername'] => useContext(MessageListContext).showUsername;
export const useMessageListHighlights = (): MessageListContextValue['highlights'] => useContext(MessageListContext).highlights;
export const useMessageListJumpToMessageParam = (): MessageListContextValue['jumpToMessageParam'] =>
	useContext(MessageListContext).jumpToMessageParam;

export const useMessageListShowColors = (): MessageListContextValue['showColors'] => useContext(MessageListContext).showColors;

export const useMessageListKatex = (): MessageListContextValue['katex'] => useContext(MessageListContext).katex;

export const useMessageListReadReceipts = (): MessageListContextValue['readReceipts'] => useContext(MessageListContext).readReceipts;

export const useMessageListAutoTranslate = (): MessageListContextValue['autoTranslate'] => useContext(MessageListContext).autoTranslate;

export const useMessageListOembedEnabled = (): MessageListContextValue['apiEmbedEnabled'] => useContext(MessageListContext).apiEmbedEnabled;

export const useMessageListAutoLinkDomains = (): MessageListContextValue['autoLinkDomains'] =>
	useContext(MessageListContext).autoLinkDomains;

export const useMessageListFormatDateAndTime = (): MessageListContextValue['formatDateAndTime'] =>
	useContext(MessageListContext).formatDateAndTime;

export const useMessageListFormatTime = (): MessageListContextValue['formatTime'] => useContext(MessageListContext).formatTime;
export const useMessageListFormatDate = (): MessageListContextValue['formatDate'] => useContext(MessageListContext).formatDate;

export const useMessageListSubscribed = (): boolean => useContext(MessageListContext).subscribed;

export const useMessageListBroadcast = (): boolean => useContext(MessageListContext).broadcast;

export const useMessageListChatAvailable = (): boolean => useContext(MessageListContext).chatAvailable;
