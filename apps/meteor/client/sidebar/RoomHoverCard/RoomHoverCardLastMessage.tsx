import type { IMessage } from '@rocket.chat/core-typings';
import { getUserDisplayName, isE2EEMessage, isVideoConfMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box } from '@rocket.chat/fuselage';
import { escapeHTML } from '@rocket.chat/tools';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTimeAgo } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { getSubscriptionUnreadData } from '../../../lib/getSubscriptionUnreadData';
import { normalizeMessagePreview } from '../../lib/utils/normalizeMessagePreview/normalizeMessagePreview';

const sectionLabelStyle = css`
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

const getPreview = (message: IMessage, t: TFunction): string => {
	if (isVideoConfMessage(message)) {
		return escapeHTML(t('Call_started'));
	}

	if (isE2EEMessage(message) && message.e2e !== 'done') {
		return escapeHTML(t('Encrypted_message_preview_unavailable'));
	}

	return normalizeMessagePreview(message, t) ?? '';
};

export type RoomHoverCardLastMessageProps = {
	message?: IMessage;
	unread: ReturnType<typeof getSubscriptionUnreadData>;
};

const RoomHoverCardLastMessage = ({ message, unread: { showUnread, unreadTitle, unreadVariant } }: RoomHoverCardLastMessageProps) => {
	const { t } = useTranslation();
	const formatTime = useTimeAgo();
	const showRealNames = useSetting('UI_Use_Real_Name', false);

	return (
		<Box
			backgroundColor='surface-tint'
			borderBlockStartWidth='default'
			borderBlockStartColor='stroke-extra-light'
			paddingInline={18}
			paddingBlockStart={14}
			paddingBlockEnd={16}
		>
			<Box display='flex' alignItems='center' justifyContent='space-between' minHeight='x20'>
				<Box fontScale='micro' color='font-hint' className={sectionLabelStyle}>
					{t('Last_Message')}
				</Box>
				{showUnread && (
					<Badge variant={unreadVariant} title={unreadTitle}>
						{unreadTitle}
					</Badge>
				)}
			</Box>
			{!message && (
				<Box fontScale='p2' color='font-secondary-info' marginBlockStart={10}>
					{t('No_messages_yet')}
				</Box>
			)}
			{message && (
				<Box display='flex' marginBlockStart={10}>
					{message.u?.username && (
						<Box flexShrink={0}>
							<UserAvatar username={message.u.username} size='x28' />
						</Box>
					)}
					<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0} marginInlineStart={10}>
						<Box display='flex' alignItems='center'>
							<Box fontScale='p2b' color='font-default' withTruncatedText>
								{getUserDisplayName(message.u?.name, message.u?.username, showRealNames)}
							</Box>
							<Box is='time' fontScale='micro' color='font-hint' flexShrink={0} marginInlineStart={6}>
								{formatTime(message.ts)}
							</Box>
						</Box>
						<Box
							fontScale='p2'
							color='font-default'
							marginBlockStart={2}
							className={clampStyle}
							dangerouslySetInnerHTML={{ __html: getPreview(message, t) }}
						/>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default RoomHoverCardLastMessage;
