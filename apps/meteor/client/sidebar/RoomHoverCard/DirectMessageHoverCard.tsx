import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Skeleton, Tag } from '@rocket.chat/fuselage';
import { useRolesDescription, useSetting, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import RoomHoverCardDialog from './RoomHoverCardDialog';
import RoomHoverCardFooter from './RoomHoverCardFooter';
import RoomHoverCardLastMessage from './RoomHoverCardLastMessage';
import RoomHoverCardQuickAction from './RoomHoverCardQuickAction';
import RoomHoverCardThreads from './RoomHoverCardThreads';
import { useRoomHoverCardActions } from './useRoomHoverCardActions';
import LocalTime from '../../components/LocalTime';
import { ReactiveUserStatus } from '../../components/UserStatus';
import { ReactiveUserStatusText } from '../../components/UserStatusText';
import { useUserInfoQuery } from '../../hooks/useUserInfoQuery';
import RoomGroupingButton from '../../views/room/Header/icons/RoomGroupingButton';
import { useUserMediaCallAction } from '../../views/room/hooks/useUserInfoActions/actions/useUserMediaCallAction';
import { useVideoCallAction } from '../../views/room/hooks/useUserInfoActions/actions/useVideoCallAction';

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

	const { data, isLoading } = useUserInfoQuery({ userId: uid }, { placeholderData: undefined });
	const user = data?.user;

	const username = user?.username ?? subscription.name;
	const displayName = getUserDisplayName(user?.name ?? subscription.fname, username, showRealNames) ?? username;
	const roles = user?.roles ? getRoles(user.roles) : [];

	const hasUnreadThreads = Boolean(subscription.tunread?.length);
	const isUnread = Boolean(subscription.alert || subscription.unread || hasUnreadThreads);

	const { openRoom, openThread, openThreads, markAsRead } = useRoomHoverCardActions({ subscription, roomName: displayName, onClose });

	const callee = { _id: uid, username, name: user?.name };
	const videoCall = useVideoCallAction(callee);
	const voiceCall = useUserMediaCallAction(callee, room._id);

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
					{(videoCall || voiceCall) && (
						<Box display='flex' marginBlockStart={10}>
							{videoCall && <RoomHoverCardQuickAction action={videoCall} />}
							{voiceCall && <RoomHoverCardQuickAction action={voiceCall} />}
						</Box>
					)}
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
				<Box flexShrink={0} marginInlineStart={8}>
					<RoomGroupingButton room={{ ...room, f: subscription.f, category: subscription.category }} />
				</Box>
			</Box>
			<RoomHoverCardLastMessage message={room.lastMessage} subscription={subscription} />
			<RoomHoverCardThreads
				room={room}
				subscription={subscription}
				roomName={displayName}
				onOpenThread={openThread}
				onOpenThreads={openThreads}
			/>
			<RoomHoverCardFooter>
				<Button small primary icon='balloon' onClick={openRoom}>
					{t('Open_conversation')}
				</Button>
				{isUnread && (
					<Button small secondary icon='check-double' onClick={markAsRead}>
						{t(hasUnreadThreads ? 'Mark_messages_and_threads_as_read' : 'Mark_as_read')}
					</Button>
				)}
			</RoomHoverCardFooter>
		</RoomHoverCardDialog>
	);
};

export default DirectMessageHoverCard;
