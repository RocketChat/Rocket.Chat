import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMainMessage, isRoomFederated } from '@rocket.chat/core-typings';
import { useFormatTime, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useLayout, useUser, useUserPreference, useSetting, useSearchParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, memo } from 'react';

import { normalizeUsername } from '../../../../../lib/utils/normalizeUsername';
import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { MessageListContext } from '../../../../components/message/list/MessageListContext';
import { useAutoTranslate } from '../../../../hooks/useAutoTranslate';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { getRegexHighlight, getRegexHighlightUrl } from '../../../../lib/highlightWords';
import { MessagesProvider } from '../../../../providers/MessagesProvider';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
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

	const user = useUser();
	const uid = user?._id;
	const subscription = useRoomSubscription();

	const { isMobile } = useLayout();

	const federationReadReceipts = useSetting('Federation_Service_EDU_Process_Receipt', false);

	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Enabled', false) && (!isRoomFederated(room) || federationReadReceipts);
	const readReceiptsStoreUsers = useSetting('Message_Read_Receipt_Store_Users', false);
	const apiEmbedEnabled = useSetting('API_Embed', false);
	const showRealName = useSetting('UI_Use_Real_Name', false);

	const displayRolesGlobal = useSetting('UI_DisplayRoles', true);
	const hideRolesPreference = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);
	const showRoles = displayRolesGlobal && hideRolesPreference;
	const userRoles = useRolesByUser(room._id, showRoles);
	const showUsername = Boolean(!useUserPreference<boolean>('hideUsernames') && !isMobile);
	const highlights = useUserPreference<string[]>('highlights');

	const autoTranslate = useAutoTranslate(subscription);
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

	const context: MessageListContextValue = useMemo<MessageListContextValue>(
		() => ({
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

			readReceipts,
			formatDateAndTime,
			formatTime,
			formatDate,
		}),
		[
			uid,
			autoTranslate,
			hasSubscription,
			showRoles,
			userRoles,
			showRealName,
			showUsername,
			parsedHighlights,
			msgParameter,
			readReceipts,
			apiEmbedEnabled,
			formatDateAndTime,
			formatTime,
			formatDate,
		],
	);

	return (
		<MessagesProvider room={room} subscription={subscription} attachmentDimension={attachmentDimension}>
			<MessageListContext.Provider value={context}>{children}</MessageListContext.Provider>
		</MessagesProvider>
	);
};

export default memo(MessageListProvider);
