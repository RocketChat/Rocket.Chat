import type { VideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Button, Message, Box, Avatar, Palette, IconButton, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';

import { useTimeAgo } from '../../../../../hooks/useTimeAgo';
import { VIDEOCONF_STACK_MAX_USERS } from '../../../../../lib/constants';
import { useGoToRoom } from '../../../hooks/useGoToRoom';

const VideoConfListItem = ({
	videoConfData,
	className = [],
	reload,
	...props
}: {
	videoConfData: VideoConference;
	className?: string[];
	reload: () => void;
}): ReactElement => {
	const t = useTranslation();
	const formatDate = useTimeAgo();
	const joinCall = useVideoConfJoinCall();

	const {
		_id: callId,
		createdBy: { name, username, _id },
		users,
		createdAt,
		endedAt,
		discussionRid,
	} = videoConfData;

	const displayName = useUserDisplayName({ name, username });
	const joinedUsers = users.filter((user) => user._id !== _id);

	const hovered = css`
		&:hover,
		&:focus {
			background: ${Palette.surface['surface-tint']};
			.rcx-message {
				background: ${Palette.surface['surface-tint']};
			}
		}
	`;

	const handleJoinConference = useEffectEvent((): void => {
		joinCall(callId);
		return reload();
	});

	const goToRoom = useGoToRoom();

	return (
		<Box
			color='default'
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={[...className, hovered].filter(Boolean)}
			pb={8}
		>
			<Message {...props}>
				<Message.LeftContainer>{username && <UserAvatar username={username} size='x36' />}</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{displayName}</Message.Name>
						<Message.Timestamp>{formatDate(createdAt)}</Message.Timestamp>
					</Message.Header>
					<Message.Body clamp={2} />
					<Box display='flex'></Box>
					<Message.Block flexDirection='row' alignItems='center'>
						<ButtonGroup>
							<Button disabled={Boolean(endedAt)} small alignItems='center' display='flex' onClick={handleJoinConference}>
								{endedAt ? t('Call_ended') : t('Join_call')}
							</Button>
							{discussionRid && (
								<IconButton
									small
									icon='discussion'
									data-drid={discussionRid}
									title={t('Join_discussion')}
									onClick={() => goToRoom(discussionRid)}
								/>
							)}
						</ButtonGroup>
						{joinedUsers.length > 0 && (
							<Box mis={8} fontScale='c1' display='flex' alignItems='center'>
								<Avatar.Stack>
									{joinedUsers.map(
										(user, index) =>
											user.username &&
											index + 1 <= VIDEOCONF_STACK_MAX_USERS && (
												<UserAvatar
													data-tooltip={user.username}
													key={user.username}
													username={user.username}
													etag={user.avatarETag}
													size='x28'
												/>
											),
									)}
								</Avatar.Stack>
								<Box mis={4}>
									{joinedUsers.length > VIDEOCONF_STACK_MAX_USERS
										? t('__usersCount__joined', { count: joinedUsers.length - VIDEOCONF_STACK_MAX_USERS })
										: t('joined')}
								</Box>
							</Box>
						)}
						{joinedUsers.length === 0 && !endedAt && (
							<Box mis={8} fontScale='c1'>
								{t('Be_the_first_to_join')}
							</Box>
						)}
					</Message.Block>
				</Message.Container>
			</Message>
		</Box>
	);
};

export default VideoConfListItem;
