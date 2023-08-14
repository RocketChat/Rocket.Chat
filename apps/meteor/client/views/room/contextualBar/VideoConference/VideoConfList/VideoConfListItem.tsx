import type { IGroupVideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Button, Message, Box, Avatar, Palette } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useVideoConfJoinCall } from '../../../../../contexts/VideoConfContext';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';
import { VIDEOCONF_STACK_MAX_USERS } from '../../../../../lib/constants';

const VideoConfListItem = ({
	videoConfData,
	className = [],
	reload,
	...props
}: {
	videoConfData: IGroupVideoConference;
	className?: string[];
	reload: () => void;
}): ReactElement => {
	const t = useTranslation();
	const formatDate = useTimeAgo();
	const joinCall = useVideoConfJoinCall();
	const showRealName = Boolean(useSetting('UI_Use_Real_Name'));

	const {
		_id: callId,
		createdBy: { name, username, _id },
		users,
		createdAt,
		endedAt,
	} = videoConfData;

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

	const handleJoinConference = useMutableCallback((): void => {
		joinCall(callId);
		return reload();
	});

	return (
		<Box
			color='default'
			borderBlockEndWidth={2}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={[...className, hovered].filter(Boolean)}
			pb={8}
		>
			<Message {...props}>
				<Message.LeftContainer>
					{username && <UserAvatar username={username} className='rcx-message__avatar' size='x36' />}
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{showRealName ? name : username}</Message.Name>
						<Message.Timestamp>{formatDate(createdAt)}</Message.Timestamp>
					</Message.Header>
					<Message.Body clamp={2} />
					<Box display='flex'></Box>
					<Message.Block flexDirection='row' alignItems='center'>
						<Button disabled={Boolean(endedAt)} small alignItems='center' display='flex' onClick={handleJoinConference}>
							{endedAt ? t('Call_ended') : t('Join_call')}
						</Button>
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
										? t('__usersCount__member_joined', { usersCount: joinedUsers.length - VIDEOCONF_STACK_MAX_USERS })
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
