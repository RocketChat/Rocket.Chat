import type { IMessage } from '@rocket.chat/core-typings';
import type { useFormatTime, useFormatDateAndTime } from '@rocket.chat/ui-client';
import type { KeyboardEvent, MouseEvent } from 'react';
import { createContext, useContext } from 'react';

import { normalizeUsername } from '../../../../lib/utils/normalizeUsername';
import type { useFormatDate } from '../../../hooks/useFormatDate';
import type { MessageNormalizer } from '../../../lib/createMessageNormalizer';
import { createMessageNormalizer } from '../../../lib/createMessageNormalizer';

export type MessageListContextValue = {
	autoTranslate: {
		showAutoTranslate: (message: IMessage) => boolean;
		autoTranslateLanguage?: string;
		autoTranslateEnabled: boolean;
	};
	showStarred: ({ message }: { message: IMessage }) => boolean;
	showFollowing: ({ message }: { message: IMessage }) => boolean;
	messageDateFormatter: () => (date: Date) => string;
	userHasReacted: (message: IMessage) => (reaction: string) => boolean;
	openEmojiPicker: (message: IMessage) => (event: MouseEvent | KeyboardEvent) => void;
	showRoles: boolean;
	/** Whether the list's room is a broadcast room the user is subscribed to. */
	isBroadcast: boolean;
	/** Role labels of the authors of messages in room `rid`; absent when the list does not resolve them. */
	userRoles?: {
		rid: string;
		get: (uid: string) => { workspaceRoles: string[]; roomRoles: string[] };
	};
	showRealName: boolean;
	getAuthorUsername: (author: Pick<IMessage['u'], 'name' | 'username'>) => { normalizedUsername: string; showUsername: boolean };
	highlights?: {
		highlight: string;
		regex: RegExp;
		urlRegex: RegExp;
	}[];
	autoTranslateLanguage?: string;
	/** Stable for the list: changes only when a setting or the room's auto-translate state does, never per message. */
	normalizeMessage: MessageNormalizer;
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
};

export const messageListContextDefaultValue: MessageListContextValue = {
	autoTranslate: {
		showAutoTranslate: () => false,
		autoTranslateLanguage: undefined,
		autoTranslateEnabled: false,
	},
	showStarred: () => false,
	showFollowing: () => false,
	userHasReacted: () => (): boolean => false,
	messageDateFormatter:
		() =>
		(date: Date): string =>
			date.toString(),
	openEmojiPicker: () => (): void => undefined,
	showRoles: false,
	isBroadcast: false,
	showRealName: false,
	getAuthorUsername: ({ username }) => ({ normalizedUsername: normalizeUsername(username), showUsername: false }),
	normalizeMessage: createMessageNormalizer({ emoticons: true }, { showAutoTranslate: () => false, autoTranslateEnabled: false }),
	username: undefined,
	apiEmbedEnabled: false,
	readReceipts: {
		enabled: false,
		storeUsers: false,
	},
	formatDateAndTime: () => '',
	formatTime: () => '',
	formatDate: () => '',
};

export const MessageListContext = createContext<MessageListContextValue>(messageListContextDefaultValue);

export const useShowTranslated: MessageListContextValue['autoTranslate']['showAutoTranslate'] = (...args) =>
	useContext(MessageListContext).autoTranslate.showAutoTranslate(...args);
export const useShowStarred: MessageListContextValue['showStarred'] = (...args) => useContext(MessageListContext).showStarred(...args);
export const useShowFollowing: MessageListContextValue['showFollowing'] = (...args) =>
	useContext(MessageListContext).showFollowing(...args);
export const useMessageDateFormatter: MessageListContextValue['messageDateFormatter'] = (...args) =>
	useContext(MessageListContext).messageDateFormatter(...args);
export const useMessageListIsBroadcast = (): MessageListContextValue['isBroadcast'] => useContext(MessageListContext).isBroadcast;
export const useMessageListShowRoles = (): MessageListContextValue['showRoles'] => useContext(MessageListContext).showRoles;
export const useMessageListUserRoles = (uid: string, rid: string) => {
	const { userRoles } = useContext(MessageListContext);
	return userRoles?.rid === rid ? userRoles.get(uid) : undefined;
};
export const useMessageListShowRealName = (): MessageListContextValue['showRealName'] => useContext(MessageListContext).showRealName;
export const useMessageListAuthorUsername: MessageListContextValue['getAuthorUsername'] = (author) =>
	useContext(MessageListContext).getAuthorUsername(author);
export const useMessageListHighlights = (): MessageListContextValue['highlights'] => useContext(MessageListContext).highlights;
export const useMessageListJumpToMessageParam = (): MessageListContextValue['jumpToMessageParam'] =>
	useContext(MessageListContext).jumpToMessageParam;

export const useUserHasReacted: MessageListContextValue['userHasReacted'] = (message: IMessage) =>
	useContext(MessageListContext).userHasReacted(message);
export const useOpenEmojiPicker: MessageListContextValue['openEmojiPicker'] = (...args) =>
	useContext(MessageListContext).openEmojiPicker(...args);

export const useMessageListNormalizer = (): MessageListContextValue['normalizeMessage'] => useContext(MessageListContext).normalizeMessage;

export const useMessageListReadReceipts = (): MessageListContextValue['readReceipts'] => useContext(MessageListContext).readReceipts;

export const useMessageListAutoTranslate = (): MessageListContextValue['autoTranslate'] => useContext(MessageListContext).autoTranslate;

export const useMessageListOembedEnabled = (): MessageListContextValue['apiEmbedEnabled'] => useContext(MessageListContext).apiEmbedEnabled;

export const useMessageListFormatDateAndTime = (): MessageListContextValue['formatDateAndTime'] =>
	useContext(MessageListContext).formatDateAndTime;

export const useMessageListFormatTime = (): MessageListContextValue['formatTime'] => useContext(MessageListContext).formatTime;
export const useMessageListFormatDate = (): MessageListContextValue['formatDate'] => useContext(MessageListContext).formatDate;
