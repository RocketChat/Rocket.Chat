import { isRoomFederated } from '@rocket.chat/core-typings';
import { useLayout, useUserPreference, useSetting, useSearchParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, memo } from 'react';

import { useMessageActionsPolicyValue, useMessageActionsValue } from './useMessageListContract';
import { GazzodownEnvironmentProvider } from '../../../../components/GazzodownEnvironment';
import { MessageActionsContext, MessageActionsPolicyContext } from '../../../../components/message/list/MessageActionsContext';
import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { MessageListContext } from '../../../../components/message/list/MessageListContext';
import { MessageViewerContext } from '../../../../components/message/list/MessageViewerContext';
import { useMessageViewerValue } from '../../../../components/message/list/MessageViewerProvider';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import { getRegexHighlight, getRegexHighlightUrl } from '../../../../lib/highlightWords';
import AttachmentProvider from '../../../../providers/AttachmentProvider';
import { useChat } from '../../contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useKatex } from '../hooks/useKatex';
import { useMessageRolesLookup } from '../hooks/useMessageRolesLookup';

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

	const subscription = useRoomSubscription();

	const { isMobile } = useLayout();

	const federationReadReceipts = useSetting('Federation_Service_EDU_Process_Receipt', false);

	const autoLinkDomains = useSetting('Message_CustomDomain_AutoLink', '');
	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Enabled', false) && (!isRoomFederated(room) || federationReadReceipts);
	const readReceiptsStoreUsers = useSetting('Message_Read_Receipt_Store_Users', false);
	const apiEmbedEnabled = useSetting('API_Embed', false);
	const showColors = useSetting('HexColorPreview_Enabled', false);

	const displayRolesGlobal = useSetting('UI_DisplayRoles', true);
	const hideRolesPreference = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);
	const showRoles = displayRolesGlobal && hideRolesPreference;
	const getMessageRoles = useMessageRolesLookup(room._id, showRoles);
	const showUsername = Boolean(!useUserPreference<boolean>('hideUsernames') && !isMobile);
	const highlights = useUserPreference<string[]>('highlights');

	const { showAutoTranslate, autoTranslateLanguage, autoTranslateEnabled } = useAutoTranslate(subscription);
	const autoTranslateOptions = useMemo(
		() => ({ showAutoTranslate, autoTranslateLanguage, autoTranslateEnabled }),
		[showAutoTranslate, autoTranslateLanguage, autoTranslateEnabled],
	);
	const viewer = useMessageViewerValue();
	const actionsPolicy = useMessageActionsPolicyValue(room);
	const actions = useMessageActionsValue(autoTranslateOptions);
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();

	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const formatDate = useFormatDate();
	const hasSubscription = Boolean(subscription);
	const msgParameter = useSearchParameter('msg');

	const chat = useChat();
	const chatAvailable = Boolean(chat);
	const broadcast = Boolean(subscription?.broadcast);

	const context: MessageListContextValue = useMemo(
		() => ({
			showColors,

			autoTranslate: {
				autoTranslateEnabled,
				autoTranslateLanguage,
				showAutoTranslate,
			},
			apiEmbedEnabled,
			autoLinkDomains,
			showRoles,
			getMessageRoles,
			showUsername,
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

			readReceipts: {
				enabled: readReceiptsEnabled,
				storeUsers: readReceiptsStoreUsers,
			},
			formatDateAndTime,
			formatTime,
			formatDate,
			subscribed: hasSubscription,
			broadcast,
			chatAvailable,
		}),
		[
			showAutoTranslate,
			autoTranslateEnabled,
			hasSubscription,
			autoTranslateLanguage,
			showRoles,
			getMessageRoles,
			showUsername,
			katexEnabled,
			katexDollarSyntaxEnabled,
			katexParenthesisSyntaxEnabled,
			highlights,
			showColors,
			msgParameter,
			readReceiptsEnabled,
			readReceiptsStoreUsers,
			apiEmbedEnabled,
			autoLinkDomains,
			formatDateAndTime,
			formatTime,
			formatDate,
			broadcast,
			chatAvailable,
		],
	);

	return (
		<AttachmentProvider width={attachmentDimension?.width} height={attachmentDimension?.height}>
			<MessageListContext.Provider value={context}>
				<MessageViewerContext.Provider value={viewer}>
					<MessageActionsPolicyContext.Provider value={actionsPolicy}>
						<MessageActionsContext.Provider value={actions}>
							<GazzodownEnvironmentProvider>{children}</GazzodownEnvironmentProvider>
						</MessageActionsContext.Provider>
					</MessageActionsPolicyContext.Provider>
				</MessageViewerContext.Provider>
			</MessageListContext.Provider>
		</AttachmentProvider>
	);
};

export default memo(MessageListProvider);
