import { IRoom } from '@rocket.chat/core-typings';
import { Skeleton, Avatar, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalFooter,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfController,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useMemo } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useVideoConfSetPreferences } from '../../../../../contexts/VideoConfContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';

type JoinVideoConfModalProps = {
	room: IRoom;
	confTitle?: string;
	callId: string;
	onClose: () => void;
	onConfirm: () => void;
};

const MAX_USERS = 6;

const JoinVideoConfModal = ({ room, confTitle, callId, onClose, onConfirm }: JoinVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();

	const handleJoinCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	const params = useMemo(() => ({ callId }), [callId]);
	const { phase, value } = useEndpointData('/v1/video-conference.info', params);

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{`${t('Join_conference')} ${confTitle || ''}`}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{phase === AsyncStatePhase.LOADING && <Skeleton />}
					{value?.users && (
						<Box display='flex' flexDirection='column' alignItems='center'>
							{value.users.length > 0 && (
								<Avatar.Stack>
									{value.users.map(
										(member, index) =>
											index + 1 <= MAX_USERS && <UserAvatar key={member._id} username={member.username || ''} etag={member.avatarETag} />,
									)}
								</Avatar.Stack>
							)}
							<Box mbs='x8' fontScale='c1' color='neutral-700'>
								{value.users.length > MAX_USERS
									? t('__usersCount__members_joined', { usersCount: value?.users && value.users.length - MAX_USERS })
									: t('joined')}
							</Box>
						</Box>
					)}
				</VideoConfModalInfo>
				<VideoConfModalControllers>
					<VideoConfController
						primary={controllersConfig.mic}
						text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
						title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
						icon={controllersConfig.mic ? 'mic' : 'mic-off'}
						onClick={handleToggleMic}
					/>
					<VideoConfController
						primary={controllersConfig.cam}
						text={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
						title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
						icon={controllersConfig.cam ? 'video' : 'video-off'}
						onClick={handleToggleCam}
					/>
				</VideoConfModalControllers>
			</VideoConfModalContent>
			<VideoConfModalFooter>
				<VideoConfButton onClick={handleJoinCall} primary>
					{t('join')}
				</VideoConfButton>
				<VideoConfButton onClick={onClose}>{t('Cancel')}</VideoConfButton>
			</VideoConfModalFooter>
		</VideoConfModal>
	);
};

export default JoinVideoConfModal;
