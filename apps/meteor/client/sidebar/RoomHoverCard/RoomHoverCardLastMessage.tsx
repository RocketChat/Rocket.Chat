import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTimeAgo } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RoomHoverCardSectionLabel from './RoomHoverCardSectionLabel';
import { getHoverCardMessagePreview } from './getHoverCardMessagePreview';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

export type RoomHoverCardLastMessageProps = {
	message?: IMessage;
	subscription: ISubscription;
};

// The room's own unread messages; unread threads are listed in a section of their own.
const getUnreadBadge = ({ unread, userMentions, groupMentions, hideUnreadStatus, hideMentionStatus }: ISubscription) => {
	const mentioned = Boolean(userMentions || groupMentions);
	const show = unread > 0 && (!hideUnreadStatus || (!hideMentionStatus && mentioned));

	if (!show) {
		return undefined;
	}

	return { count: unread, variant: (userMentions && 'danger') || (groupMentions && 'warning') || 'primary' } as const;
};

const RoomHoverCardLastMessage = ({ message, subscription }: RoomHoverCardLastMessageProps) => {
	const { t } = useTranslation();
	const formatTime = useTimeAgo();
	const showRealNames = useSetting('UI_Use_Real_Name', false);
	const unreadBadge = getUnreadBadge(subscription);

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
				<RoomHoverCardSectionLabel>{t('Last_Message')}</RoomHoverCardSectionLabel>
				{unreadBadge && <Badge variant={unreadBadge.variant}>{t('unread_messages_counter', { count: unreadBadge.count })}</Badge>}
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
							dangerouslySetInnerHTML={{ __html: getHoverCardMessagePreview(message, t) }}
						/>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default RoomHoverCardLastMessage;
