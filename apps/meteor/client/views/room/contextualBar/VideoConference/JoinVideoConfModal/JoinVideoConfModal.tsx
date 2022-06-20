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
	onClose: () => void;
	onConfirm: () => void;
};

const MAX_USERS = 6;

const JoinVideoConfModal = ({ room, confTitle, onClose, onConfirm }: JoinVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const rid = room._id;
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();

	const handleJoinCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	const params = useMemo(() => ({ roomId: rid }), [rid]);

	// TODO: Experimental only, this data will come from the new collection
	const { phase, value } = useEndpointData(`${room.t === 'c' ? '/v1/channels.members' : '/v1/groups.members'}`, params);

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{t('Join_conference__name__', { name: confTitle })}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{phase === AsyncStatePhase.LOADING && <Skeleton />}
					<Box display='flex' flexDirection='column' alignItems='center'>
						{value?.members && value.members.length > 0 && (
							<Avatar.Stack>
								{value.members.map(
									(member, index) =>
										index + 1 <= MAX_USERS && <UserAvatar key={member._id} username={member.username || ''} etag={member.avatarETag} />,
								)}
							</Avatar.Stack>
						)}
						{value?.members && value.members.length > MAX_USERS && (
							<Box mbs='x8' fontScale='c1' color='neutral-700'>
								{t('__usersCount__members_joined', { usersCount: value?.members && value.members.length - MAX_USERS })}
							</Box>
						)}
					</Box>
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
