import type { VideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Button,
	Message,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageBody,
	MessageBlock,
	Box,
	Palette,
	IconButton,
	ButtonGroup,
	AvatarStack,
} from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
}) => {
	const { t } = useTranslation();
	const formatDate = useTimeAgo();
	const joinCall = useVideoConfJoinCall();
	const settingName = useSetting<string>('VideoConf_Persistent_Chat_Discussion_Name', t('[date] Video Call Chat'));

	const {
		_id: callId,
		createdBy: { _id },
		users,
		createdAt,
		endedAt,
		discussionRid,
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

	const handleJoinConference = useStableCallback((): void => {
		joinCall(callId);
		return reload();
	});

	const goToRoom = useGoToRoom();

	const name = useMemo(() => {
		const date = new Date().toISOString().substring(0, 10);
		return settingName.includes('[date]') ? settingName.replace('[date]', date) : `${date} ${settingName}`;
	}, [settingName]);

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
				<MessageContainer>
					<MessageHeader>
						<MessageName title={name}>{name}</MessageName>
						<MessageTimestamp>{formatDate(createdAt)}</MessageTimestamp>
					</MessageHeader>
					<MessageBody clamp={2} />
					<MessageBlock flexDirection='row' alignItems='center'>
						<ButtonGroup>
							{!endedAt ? (
								<Button primary small icon='video' alignItems='center' display='flex' onClick={handleJoinConference}>
									{t('Join_call')}
								</Button>
							) : (
								<Button
									small
									alignItems='center'
									display='flex'
									icon='discussion'
									disabled={!discussionRid}
									onClick={discussionRid ? () => goToRoom(discussionRid) : undefined}
								>
									{t('Call_chat')}
								</Button>
							)}
							{!endedAt && discussionRid && (
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
								<Box mis={4}>
									{joinedUsers.length > VIDEOCONF_STACK_MAX_USERS ? `+${joinedUsers.length - VIDEOCONF_STACK_MAX_USERS}` : null}
								</Box>
							</Box>
						)}
						{joinedUsers.length === 0 && !endedAt && (
							<Box mis={8} fontScale='c1'>
								{t('Be_the_first_to_join')}
							</Box>
						)}
					</MessageBlock>
				</MessageContainer>
			</Message>
		</Box>
	);
};

export default VideoConfListItem;
