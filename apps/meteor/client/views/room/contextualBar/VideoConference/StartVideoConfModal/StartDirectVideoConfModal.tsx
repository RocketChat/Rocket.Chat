import { IDirectMessageRoom, IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalFooter,
	VideoConfController,
	VideoConfButton,
	useVideoConfControllers,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import ReactiveUserStatus from '../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useVideoConfSetPreferences } from '../../../../../contexts/VideoConfContext';

type StartDirectVideoConfModalProps = {
	room: IDirectMessageRoom;
	uid: IUser['_id'];
	onClose: () => void;
	onConfirm: () => void;
};

const StartDirectVideoConfModal = ({ room, uid, onClose, onConfirm }: StartDirectVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();

	const handleStartCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{t('Start_a_call_with')}</VideoConfModalTitle>
				<VideoConfModalInfo>
					<ReactiveUserStatus uid={uid} />
					<Box mis='x8'>{room.fname}</Box>
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
				<VideoConfButton onClick={handleStartCall} primary icon='phone'>
					{t('Start_call')}
				</VideoConfButton>
				<VideoConfButton onClick={onClose}>{t('Cancel')}</VideoConfButton>
			</VideoConfModalFooter>
		</VideoConfModal>
	);
};

export default StartDirectVideoConfModal;
