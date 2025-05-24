import type { IMessage } from '@rocket.chat/core-typings';
import type { KeyboardEvent, MouseEvent, RefCallback } from 'react';
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
	useShowStarred: ({ message }: { message: IMessage }) => boolean;
	useShowFollowing: ({ message }: { message: IMessage }) => boolean;
	useMessageDateFormatter: () => (date: Date) => string;
	useUserHasReacted: (message: IMessage) => (reaction: string) => boolean;
	useOpenEmojiPicker: (message: IMessage) => (event: MouseEvent | KeyboardEvent) => void;
	showRoles: boolean;
	showRealName: boolean;
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
	username: string | undefined;
	apiEmbedEnabled: boolean;
	readReceipts: {
		enabled: boolean;
		storeUsers: boolean;
	};
	formatDateAndTime: ReturnType<typeof useFormatDateAndTime>;
	formatTime: ReturnType<typeof useFormatTime>;
	formatDate: ReturnType<typeof useFormatDate>;
	messageListRef?: RefCallback<HTMLElement | undefined>;
};

export const MessageListContext = createContext<MessageListContextValue>({
	autoTranslate: {
		showAutoTranslate: () => false,
		autoTranslateLanguage: undefined,
		autoTranslateEnabled: false,
	},
	useShowStarred: () => false,
	useShowFollowing: () => false,
	useUserHasReacted: () => (): boolean => false,
	useMessageDateFormatter:
		() =>
		(date: Date): string =>
			date.toString(),
	useOpenEmojiPicker: () => (): void => undefined,
	showRoles: false,
	showRealName: false,
	showUsername: false,
	showColors: false,
	username: undefined,
	apiEmbedEnabled: false,
	readReceipts: {
		enabled: false,
		storeUsers: false,
	},
	autoLinkDomains: '',
	formatDateAndTime: () => '',
	formatTime: () => '',
	formatDate: () => '',
	messageListRef: undefined,
});

export const useShowTranslated: MessageListContextValue['autoTranslate']['showAutoTranslate'] = (...args) =>
	useContext(MessageListContext).autoTranslate.showAutoTranslate(...args);
export const useShowStarred: MessageListContextValue['useShowStarred'] = (...args) =>
	useContext(MessageListContext).useShowStarred(...args);
export const useShowFollowing: MessageListContextValue['useShowFollowing'] = (...args) =>
	useContext(MessageListContext).useShowFollowing(...args);
export const useMessageDateFormatter: MessageListContextValue['useMessageDateFormatter'] = (...args) =>
	useContext(MessageListContext).useMessageDateFormatter(...args);
export const useMessageListShowRoles = (): MessageListContextValue['showRoles'] => useContext(MessageListContext).showRoles;
export const useMessageListShowRealName = (): MessageListContextValue['showRealName'] => useContext(MessageListContext).showRealName;
export const useMessageListShowUsername = (): MessageListContextValue['showUsername'] => useContext(MessageListContext).showUsername;
export const useMessageListHighlights = (): MessageListContextValue['highlights'] => useContext(MessageListContext).highlights;
export const useMessageListJumpToMessageParam = (): MessageListContextValue['jumpToMessageParam'] =>
	useContext(MessageListContext).jumpToMessageParam;

export const useUserHasReacted: MessageListContextValue['useUserHasReacted'] = (message: IMessage) =>
	useContext(MessageListContext).useUserHasReacted(message);
export const useOpenEmojiPicker: MessageListContextValue['useOpenEmojiPicker'] = (...args) =>
	useContext(MessageListContext).useOpenEmojiPicker(...args);

export const useMessageListRef = (): MessageListContextValue['messageListRef'] => useContext(MessageListContext).messageListRef;

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
