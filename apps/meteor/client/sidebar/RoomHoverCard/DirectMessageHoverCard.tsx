import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Skeleton, Tag } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useRolesDescription, useSetting, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import RoomHoverCardDialog from './RoomHoverCardDialog';
import RoomHoverCardFooter from './RoomHoverCardFooter';
import RoomHoverCardLastMessage from './RoomHoverCardLastMessage';
import RoomHoverCardQuickAction from './RoomHoverCardQuickAction';
import { useRoomHoverCardActions } from './useRoomHoverCardActions';
import LocalTime from '../../components/LocalTime';
import { ReactiveUserStatus } from '../../components/UserStatus';
import { ReactiveUserStatusText } from '../../components/UserStatusText';
import { useRoomMenuActions } from '../../hooks/useRoomMenuActions';
import { useUserInfoQuery } from '../../hooks/useUserInfoQuery';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useUserMediaCallAction } from '../../views/room/hooks/useUserInfoActions/actions/useUserMediaCallAction';
import { useVideoCallAction } from '../../views/room/hooks/useUserInfoActions/actions/useVideoCallAction';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

const avatarStyle = css`
	object-fit: cover;
`;

const bioStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

export type DirectMessageHoverCardProps = {
	uid: IUser['_id'];
	room: IRoom;
	subscription: ISubscription;
	onClose: () => void;
};

const DirectMessageHoverCard = ({ uid, room, subscription, onClose }: DirectMessageHoverCardProps) => {
	const { t } = useTranslation();
	const titleId = useId();
	const getRoles = useRolesDescription();
	const getUserAvatarPath = useUserAvatarPath();
	const showRealNames = useSetting('UI_Use_Real_Name', false);
	const openedRoom = useOpenedRoom();

	const { data, isLoading } = useUserInfoQuery({ userId: uid }, { placeholderData: undefined });
	const user = data?.user;

	const username = user?.username ?? subscription.name;
	const displayName = getUserDisplayName(user?.name ?? subscription.fname, username, showRealNames) ?? username;
	const roles = user?.roles ? getRoles(user.roles) : [];

	const unread = useUnreadDisplay(subscription);
	const isUnread = Boolean(subscription.alert || subscription.unread || unread.unreadCount.threads);

	const { openRoom, markAsRead } = useRoomHoverCardActions({ subscription, roomName: displayName, onClose });

	const callee = { _id: uid, username, name: user?.name };
	const videoCall = useVideoCallAction(callee);
	const voiceCall = useUserMediaCallAction(callee, room._id);

	const menuSections = useRoomMenuActions({
		rid: room._id,
		type: room.t,
		name: displayName,
		isUnread,
		cl: room.cl,
		roomOpen: openedRoom === room._id,
		hideDefaultOptions: false,
	});

	return (
		<RoomHoverCardDialog aria-labelledby={titleId}>
			<Box display='flex' paddingInline={18} paddingBlockStart={18} paddingBlockEnd={16}>
				<Box display='flex' flexDirection='column' alignItems='center' flexShrink={0}>
					<Box
						is='img'
						src={getUserAvatarPath({ username, etag: user?.avatarETag })}
						alt=''
						width='x76'
						height='x76'
						borderRadius='default'
						className={avatarStyle}
					/>
					<Box display='flex' marginBlockStart={10}>
						{videoCall && <RoomHoverCardQuickAction action={videoCall} />}
						{voiceCall && <RoomHoverCardQuickAction action={voiceCall} />}
						{menuSections.length > 0 && (
							<GenericMenu mini icon='kebab' title={t('More')} sections={menuSections} placement='bottom-start' callbackAction={onClose} />
						)}
					</Box>
				</Box>
				<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0} marginInlineStart={14}>
					<Box display='flex' alignItems='center'>
						<ReactiveUserStatus uid={uid} />
						<Box id={titleId} fontScale='h4' color='font-default' marginInlineStart={6} withTruncatedText>
							{displayName}
						</Box>
					</Box>
					<Box display='flex' fontScale='p2' color='font-secondary-info' marginBlockStart={4} minWidth={0}>
						<Box withTruncatedText>@{username}</Box>
						<Box flexShrink={0} marginInline={4} aria-hidden>
							·
						</Box>
						<Box flexShrink={0}>
							<ReactiveUserStatusText uid={uid} />
						</Box>
					</Box>
					{isLoading && <Skeleton width='x160' marginBlockStart={8} />}
					{roles.length > 0 && (
						<Box marginBlockStart={8}>
							<Box display='flex' flexWrap='wrap' margin='neg-x2'>
								{roles.map((role) => (
									<Box key={role} margin={2}>
										<Tag>{role}</Tag>
									</Box>
								))}
							</Box>
						</Box>
					)}
					{typeof user?.utcOffset === 'number' && (
						<Box display='flex' alignItems='center' fontScale='c1' color='font-secondary-info' marginBlockStart={8}>
							<Icon name='clock' size='x14' color='font-hint' marginInlineEnd={6} />
							<LocalTime utcOffset={user.utcOffset} />
						</Box>
					)}
					{user?.bio && (
						<Box fontScale='c1' color='font-hint' marginBlockStart={6} className={bioStyle}>
							{user.bio}
						</Box>
					)}
				</Box>
			</Box>
			<RoomHoverCardLastMessage message={room.lastMessage} unread={unread} />
			<RoomHoverCardFooter>
				<Button small primary icon='balloon' onClick={openRoom}>
					{t('Open_conversation')}
				</Button>
				{isUnread && (
					<Button small secondary icon='check-double' onClick={markAsRead}>
						{t('Mark_as_read')}
					</Button>
				)}
			</RoomHoverCardFooter>
		</RoomHoverCardDialog>
	);
};

export default DirectMessageHoverCard;
