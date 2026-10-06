import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Palette } from '@rocket.chat/fuselage';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import RoomHoverCardDialog from './RoomHoverCardDialog';
import RoomHoverCardFooter from './RoomHoverCardFooter';
import RoomHoverCardKind from './RoomHoverCardKind';
import RoomHoverCardLastMessage from './RoomHoverCardLastMessage';
import { useRoomHoverCardActions } from './useRoomHoverCardActions';
import MarkdownText from '../../components/MarkdownText';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import RoomGroupingButton from '../../views/room/Header/icons/RoomGroupingButton';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

const MEMBER_AVATARS = 3;

const topicStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

const stackedAvatarStyle = css`
	box-shadow: 0 0 0 2px ${Palette.surface['surface-light']};
`;

const getNotificationsLabel = (subscription: ISubscription, t: TFunction) => {
	if (subscription.disableNotifications) {
		return t('Notifications_off');
	}

	switch (subscription.desktopNotifications) {
		case 'all':
			return t('All_messages');
		case 'mentions':
			return t('Mentions_only');
		case 'nothing':
			return t('Nothing');
		default:
			return t('Default');
	}
};

export type ChannelHoverCardProps = {
	room: IRoom;
	subscription: ISubscription;
	onClose: () => void;
};

const ChannelHoverCard = ({ room, subscription, onClose }: ChannelHoverCardProps) => {
	const { t } = useTranslation();
	const titleId = useId();
	const roomName = roomCoordinator.getRoomName(room.t, room);
	const isMuted = Boolean(subscription.disableNotifications);

	const unread = useUnreadDisplay(subscription);
	const isUnread = Boolean(subscription.alert || subscription.unread || unread.unreadCount.threads);

	const { openRoom, markAsRead, toggleNotifications } = useRoomHoverCardActions({ subscription, roomName, onClose });

	const getMembers = useEndpoint('GET', '/v1/rooms.membersOrderedByRole');
	const { data: members = [] } = useQuery({
		queryKey: ['sidebar', 'room-hover-card', room._id, 'members'],
		queryFn: async () => (await getMembers({ roomId: room._id, count: MEMBER_AVATARS })).members,
		staleTime: 60_000,
	});

	return (
		<RoomHoverCardDialog aria-labelledby={titleId}>
			<Box paddingInline={18} paddingBlockStart={18} paddingBlockEnd={16}>
				<Box display='flex' alignItems='center'>
					<RoomAvatar room={room} size='x48' />
					<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0} marginInlineStart={12}>
						<Box id={titleId} fontScale='h4' color='font-default' withTruncatedText>
							{roomName}
						</Box>
						<Box fontScale='c1' color='font-secondary-info' marginBlockStart={2} withTruncatedText>
							<RoomHoverCardKind room={room} onNavigate={onClose} />
						</Box>
					</Box>
					<RoomGroupingButton room={{ ...room, f: subscription.f, category: subscription.category }} />
				</Box>
				{room.topic && (
					<Box fontScale='p2' color='font-secondary-info' marginBlockStart={12} className={topicStyle}>
						<MarkdownText parseEmoji variant='inline' content={room.topic} />
					</Box>
				)}
				<Box display='flex' alignItems='center' fontScale='c1' color='font-secondary-info' marginBlockStart={12}>
					<Box display='flex' alignItems='center'>
						{members.map(
							(member, index) =>
								member.username && (
									<Box
										key={member._id}
										display='flex'
										borderRadius='default'
										marginInlineStart={index > 0 ? 'neg-x4' : undefined}
										className={stackedAvatarStyle}
									>
										<UserAvatar username={member.username} size='x20' />
									</Box>
								),
						)}
						<Box marginInlineStart={members.length > 0 ? 6 : undefined}>{t('Members_count', { count: room.usersCount })}</Box>
					</Box>
					<Box display='flex' alignItems='center' marginInlineStart={14} minWidth={0}>
						<Icon name={isMuted ? 'bell-off' : 'bell'} size='x14' color='font-hint' marginInlineEnd={4} />
						<Box withTruncatedText>{getNotificationsLabel(subscription, t)}</Box>
					</Box>
				</Box>
			</Box>
			<RoomHoverCardLastMessage message={room.lastMessage} unread={unread} />
			<RoomHoverCardFooter>
				<Button small primary icon={room.t === 'd' ? 'balloon' : 'arrow-forward'} onClick={openRoom}>
					{t(room.t === 'd' ? 'Open_conversation' : 'Open_channel')}
				</Button>
				{isUnread && (
					<Button small secondary icon='check-double' onClick={markAsRead}>
						{t('Mark_as_read')}
					</Button>
				)}
				<Button small secondary icon={isMuted ? 'bell' : 'bell-off'} onClick={toggleNotifications}>
					{t(isMuted ? 'Unmute_room_notifications' : 'Mute_room_notifications')}
				</Button>
			</RoomHoverCardFooter>
		</RoomHoverCardDialog>
	);
};

export default ChannelHoverCard;
