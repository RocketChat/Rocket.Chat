import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMainMessage, isRoomFederated } from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';
import { useFormatTime, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useLayout, useUser, useUserPreference, useSetting, useEndpoint, useSearchParameter } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useMemo, memo } from 'react';

import { normalizeUsername } from '../../../../../lib/utils/normalizeUsername';
import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { MessageListContext } from '../../../../components/message/list/MessageListContext';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { createMessageNormalizer } from '../../../../lib/createMessageNormalizer';
import { getRegexHighlight, getRegexHighlightUrl } from '../../../../lib/highlightWords';
import AttachmentProvider from '../../../../providers/AttachmentProvider';
import { useChat } from '../../contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useAutoLinkDomains } from '../hooks/useAutoLinkDomains';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useKatex } from '../hooks/useKatex';
import { useRolesByUser } from '../hooks/useRolesByUser';

export type MessageListProviderProps = {
	children: ReactNode;
	attachmentDimension?: {
		width?: number;
		height?: number;
	};
};

const MessageListProvider = ({ children, attachmentDimension }: MessageListProviderProps) => {
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

	const federationReadReceipts = useSetting('Federation_Service_EDU_Process_Receipt', false);

	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Enabled', false) && (!isRoomFederated(room) || federationReadReceipts);
	const readReceiptsStoreUsers = useSetting('Message_Read_Receipt_Store_Users', false);
	const apiEmbedEnabled = useSetting('API_Embed', false);
	const showRealName = useSetting('UI_Use_Real_Name', false);
	const showColors = useSetting('HexColorPreview_Enabled', false);

	const displayRolesGlobal = useSetting('UI_DisplayRoles', true);
	const hideRolesPreference = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);
	const showRoles = displayRolesGlobal && hideRolesPreference;
	const userRoles = useRolesByUser(room._id, showRoles);
	const showUsername = Boolean(!useUserPreference<boolean>('hideUsernames') && !isMobile);
	const highlights = useUserPreference<string[]>('highlights');

	const autoTranslate = useAutoTranslate(subscription);
	const autoLinkDomains = useAutoLinkDomains();
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();

	const parseOptions = useMemo<Options>(
		() => ({
			colors: showColors,
			emoticons: true,
			customDomains: autoLinkDomains,
			...(katexEnabled && {
				katex: { dollarSyntax: katexDollarSyntaxEnabled, parenthesisSyntax: katexParenthesisSyntaxEnabled },
			}),
		}),
		[showColors, autoLinkDomains, katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled],
	);

	const normalizeMessage = useMemo(() => createMessageNormalizer(parseOptions, autoTranslate), [parseOptions, autoTranslate]);

	const parsedHighlights = useMemo(
		() =>
			highlights
				?.map((str) => str.trim())
				.map((highlight) => ({
					highlight,
					regex: getRegexHighlight(highlight),
					urlRegex: getRegexHighlightUrl(highlight),
				})),
		[highlights],
	);

	const readReceipts = useMemo(
		() => ({ enabled: readReceiptsEnabled, storeUsers: readReceiptsStoreUsers }),
		[readReceiptsEnabled, readReceiptsStoreUsers],
	);

	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const formatDate = useFormatDate();
	const hasSubscription = Boolean(subscription);
	const msgParameter = useSearchParameter('msg');

	const chat = useChat();

	const context: MessageListContextValue = useMemo<MessageListContextValue>(
		() => ({
			normalizeMessage,
			useUserHasReacted: username
				? (message: IMessage) =>
						(reaction: string): boolean =>
							Boolean(message.reactions?.[reaction]?.usernames.includes(username))
				: () => (): boolean => false,
			useShowFollowing: uid
				? ({ message }: { message: IMessage }): boolean =>
						Boolean(message.replies && message.replies.indexOf(uid) > -1 && !isThreadMainMessage(message))
				: (): boolean => false,

			autoTranslate,
			useShowStarred: hasSubscription
				? ({ message }: { message: IMessage }): boolean =>
						Boolean(Array.isArray(message.starred) && message.starred.find((star) => star._id === uid))
				: (): boolean => false,
			useMessageDateFormatter:
				() =>
				(date: Date): string =>
					date.toLocaleString(),
			apiEmbedEnabled,
			showRoles,
			userRoles,
			showRealName,
			getAuthorUsername: ({ name, username }) => {
				const normalizedUsername = normalizeUsername(username);
				const nameRepeatsUsername = !name || normalizeUsername(name) === normalizedUsername;
				return { normalizedUsername, showUsername: showUsername && showRealName && !nameRepeatsUsername };
			},
			jumpToMessageParam: msgParameter,
			highlights: parsedHighlights,

			useOpenEmojiPicker: uid
				? (message: IMessage) =>
						(e: MouseEvent | KeyboardEvent): void => {
							e.nativeEvent.stopImmediatePropagation();
							chat?.emojiPicker.open(e.currentTarget, (emoji: string) => reactToMessage({ messageId: message._id, reaction: emoji }));
						}
				: () => (): void => undefined,
			username,
			readReceipts,
			formatDateAndTime,
			formatTime,
			formatDate,
		}),
		[
			username,
			uid,
			autoTranslate,
			hasSubscription,
			showRoles,
			userRoles,
			showRealName,
			showUsername,
			parsedHighlights,
			reactToMessage,
			normalizeMessage,
			msgParameter,
			chat?.emojiPicker,
			readReceipts,
			apiEmbedEnabled,
			formatDateAndTime,
			formatTime,
			formatDate,
		],
	);

	return (
		<AttachmentProvider width={attachmentDimension?.width} height={attachmentDimension?.height}>
			<MessageListContext.Provider value={context}>{children}</MessageListContext.Provider>
		</AttachmentProvider>
	);
};

export default memo(MessageListProvider);
