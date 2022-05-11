import { IDirectMessageRoom, IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfModalController,
	VideoConfModalFooter,
	VideoConfModalControllerButton,
	VideoConfModalFooterButton,
	useVideoConfControllers,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import ReactiveUserStatus from '../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../components/avatar/RoomAvatar';

type StartDirectVideoConfModalProps = {
	room: IDirectMessageRoom;
	uid: IUser['_id'];
	onClose: () => void;
};

const StartDirectVideoConfModal = ({ room, uid, onClose }: StartDirectVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const { controllersConfig, handleToggleMic, handleToggleVideo } = useVideoConfControllers();

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
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={controllersConfig.mic}
							text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
							title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
							icon={controllersConfig.mic ? 'mic' : 'mic-off'}
							onClick={handleToggleMic}
						/>
					</VideoConfModalController>
					<VideoConfModalController>
						<VideoConfModalControllerButton
							primary={controllersConfig.video}
							text={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
							title={controllersConfig.video ? t('Cam_on') : t('Cam_off')}
							icon={controllersConfig.video ? 'video' : 'video-off'}
							onClick={handleToggleVideo}
						/>
					</VideoConfModalController>
				</VideoConfModalControllers>
			</VideoConfModalContent>
			<VideoConfModalFooter>
				<VideoConfModalFooterButton primary icon='phone'>
					{t('Start_call')}
				</VideoConfModalFooterButton>
				<VideoConfModalFooterButton onClick={onClose}>{t('Cancel')}</VideoConfModalFooterButton>
			</VideoConfModalFooter>
		</VideoConfModal>
	);
};

export default StartDirectVideoConfModal;
