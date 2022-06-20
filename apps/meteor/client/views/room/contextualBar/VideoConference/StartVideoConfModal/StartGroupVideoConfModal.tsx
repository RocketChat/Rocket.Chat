import { IRoom } from '@rocket.chat/core-typings';
import { TextInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalControllers,
	VideoConfController,
	VideoConfModalFooter,
	VideoConfButton,
	useVideoConfControllers,
	VideoConfModalField,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, useState, ChangeEvent } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useVideoConfSetPreferences } from '../../../../../contexts/VideoConfContext';

type StartGroupVideoConfModalProps = {
	room: IRoom;
	onClose: () => void;
	onConfirm: (title?: string) => void;
};

const StartGroupVideoConfModal = ({ room, onClose, onConfirm }: StartGroupVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const [confTitle, setConfTitle] = useState<string | undefined>(undefined);
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers();
	const setPreferences = useVideoConfSetPreferences();

	const handleStartCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm(confTitle);
	});

	return (
		<VideoConfModal>
			<VideoConfModalContent>
				<RoomAvatar room={room} size='x124' />
				<VideoConfModalTitle>{t('Start_conference_call')}</VideoConfModalTitle>
				<VideoConfModalInfo>
					{room.usersCount && t('__usersCount__people_will_be_invited', { usersCount: room.usersCount - 1 })}
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
				<VideoConfModalField>
					<TextInput
						width='full'
						placeholder={t('Conference_name')}
						value={confTitle}
						onChange={(e: ChangeEvent<HTMLInputElement>): void => setConfTitle(e.target.value)}
					/>
				</VideoConfModalField>
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

export default StartGroupVideoConfModal;
