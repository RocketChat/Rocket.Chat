import { hasJoinedVideoConference, type VideoConference } from '@rocket.chat/core-typings';
import {
	Button,
	Message,
	MessageLeftContainer,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageBody,
	MessageBlock,
	IconButton,
	ButtonGroup,
	AvatarStack,
	Stack,
	Text,
} from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTimeAgo, useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';

import CallHistoryItem from './layout/CallHistoryItem';
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
}) => {
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
	// Excludes the creator, and also members who never joined: `users` is the conference's membership list, so
	// someone added to the call is in it whether or not they ever answered. A member with no username is left out
	// too — the avatar stack has nothing to draw for them, so they took a place in the row and left a gap in it
	// while still counting towards the total underneath.
	const joinedUsers = users.filter((user) => user._id !== _id && !!user.username && hasJoinedVideoConference(user));

	const handleJoinConference = useStableCallback((): void => {
		joinCall(callId);
		return reload();
	});

	const goToRoom = useGoToRoom();

	return (
		<CallHistoryItem className={className}>
			<Message {...props}>
				<MessageLeftContainer>{username && <UserAvatar username={username} size='x36' />}</MessageLeftContainer>
				<MessageContainer>
					<MessageHeader>
						<MessageName title={username}>{displayName}</MessageName>
						<MessageTimestamp>{formatDate(createdAt)}</MessageTimestamp>
					</MessageHeader>
					<MessageBody clamp={2} />
					<MessageBlock>
						<Stack direction='row' align='center' gap='x8'>
							<ButtonGroup>
								<Button disabled={Boolean(endedAt)} size='small' onClick={handleJoinConference}>
									{endedAt ? t('Call_ended') : t('Join_call')}
								</Button>
								{discussionRid && (
									<IconButton
										size='small'
										icon='discussion'
										data-drid={discussionRid}
										title={t('Join_discussion')}
										onClick={() => goToRoom(discussionRid)}
									/>
								)}
							</ButtonGroup>
							{joinedUsers.length > 0 && (
								<Stack direction='row' align='center' gap='x4'>
									<AvatarStack>
										{joinedUsers.map(
											(user, index) =>
												user.username &&
												index + 1 <= VIDEOCONF_STACK_MAX_USERS && (
													<UserAvatar
														data-tooltip={user.username}
														key={user.username}
														username={user.username}
														etag={user.avatarETag ?? undefined}
														size='x28'
													/>
												),
										)}
									</AvatarStack>
									<Text fontScale='c1'>
										{joinedUsers.length > VIDEOCONF_STACK_MAX_USERS
											? t('__usersCount__joined', { count: joinedUsers.length - VIDEOCONF_STACK_MAX_USERS })
											: t('joined')}
									</Text>
								</Stack>
							)}
							{joinedUsers.length === 0 && !endedAt && <Text fontScale='c1'>{t('Be_the_first_to_join')}</Text>}
						</Stack>
					</MessageBlock>
				</MessageContainer>
			</Message>
		</CallHistoryItem>
	);
};

export default VideoConfListItem;
