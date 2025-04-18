import { isThreadMainMessage } from '@rocket.chat/core-typings';
import { useLayout, useUser, useUserPreference, useSetting, useEndpoint, useSearchParameter } from '@rocket.chat/ui-contexts';
import type { MutableRefObject, ReactNode } from 'react';
import { useMemo, memo } from 'react';

import { getRegexHighlight, getRegexHighlightUrl } from '../../../../../app/highlight-words/client/helper';
import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { MessageListContext } from '../../../../components/message/list/MessageListContext';
import AttachmentProvider from '../../../../providers/AttachmentProvider';
import { useChat } from '../../contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useKatex } from '../hooks/useKatex';
import { useLoadSurroundingMessages } from '../hooks/useLoadSurroundingMessages';

type MessageListProviderProps = {
	children: ReactNode;
	messageListRef?: MutableRefObject<HTMLElement | undefined>;
	attachmentDimension?: {
		width?: number;
		height?: number;
	};
};

const MessageListProvider = ({ children, messageListRef, attachmentDimension }: MessageListProviderProps) => {
	const room = useRoom();

	if (!room) {
		throw new Error('Room not found');
	}

	const reactToMessage = useEndpoint('POST', '/v1/chat.react');
	const user = useUser();
	const uid = user?._id;
	const username = user?.username;
	const subscription = useRoomSubscription();

	const { isMobile } = useLayout();

	const showRealName = useSetting('UI_Use_Real_Name', false);
	const showColors = useSetting('HexColorPreview_Enabled', false);

	const displayRolesGlobal = useSetting('UI_DisplayRoles', true);
	const hideRolesPreference = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);
	const showRoles = displayRolesGlobal && hideRolesPreference;
	const showUsername = Boolean(!useUserPreference<boolean>('hideUsernames') && !isMobile);
	const highlights = useUserPreference<string[]>('highlights');

	const { showAutoTranslate, autoTranslateLanguage } = useAutoTranslate(subscription);
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();

	const hasSubscription = Boolean(subscription);
	const msgParameter = useSearchParameter('msg');

	useLoadSurroundingMessages(msgParameter);

	const chat = useChat();

	const context: MessageListContextValue = useMemo(
		() => ({
			showColors,
			useUserHasReacted: username
				? (message) =>
						(reaction): boolean =>
							Boolean(message.reactions?.[reaction].usernames.includes(username))
				: () => (): boolean => false,
			useShowFollowing: uid
				? ({ message }): boolean => Boolean(message.replies && message.replies.indexOf(uid) > -1 && !isThreadMainMessage(message))
				: (): boolean => false,
			autoTranslateLanguage,
			useShowTranslated: showAutoTranslate,
			useShowStarred: hasSubscription
				? ({ message }): boolean => Boolean(Array.isArray(message.starred) && message.starred.find((star) => star._id === uid))
				: (): boolean => false,
			useMessageDateFormatter:
				() =>
				(date: Date): string =>
					date.toLocaleString(),
			showRoles,
			showRealName,
			showUsername,
			messageListRef,
			jumpToMessageParam: msgParameter,
			...(katexEnabled && {
				katex: {
					dollarSyntaxEnabled: katexDollarSyntaxEnabled,
					parenthesisSyntaxEnabled: katexParenthesisSyntaxEnabled,
				},
			}),
			highlights: highlights
				?.map((str) => str.trim())
				.map((highlight) => ({
					highlight,
					regex: getRegexHighlight(highlight),
					urlRegex: getRegexHighlightUrl(highlight),
				})),

			useOpenEmojiPicker: uid
				? (message) =>
						(e): void => {
							e.nativeEvent.stopImmediatePropagation();
							chat?.emojiPicker.open(e.currentTarget, (emoji: string) => reactToMessage({ messageId: message._id, reaction: emoji }));
						}
				: () => (): void => undefined,
			username,
		}),
		[
			username,
			uid,
			showAutoTranslate,
			hasSubscription,
			autoTranslateLanguage,
			showRoles,
			showRealName,
			showUsername,
			katexEnabled,
			katexDollarSyntaxEnabled,
			katexParenthesisSyntaxEnabled,
			highlights,
			reactToMessage,
			showColors,
			msgParameter,
			messageListRef,
			chat?.emojiPicker,
		],
	);

	return (
		<AttachmentProvider width={attachmentDimension?.width} height={attachmentDimension?.height}>
			<MessageListContext.Provider value={context}>{children}</MessageListContext.Provider>
		</AttachmentProvider>
	);
};

export default memo(MessageListProvider);
