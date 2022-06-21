import { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfModal,
	VideoConfModalContent,
	VideoConfModalInfo,
	VideoConfModalTitle,
	VideoConfModalFooter,
	VideoConfButton,
	useVideoConfControllers,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useVideoConfSetPreferences } from '../../../../../contexts/VideoConfContext';

type StartOmnichannelVideoConfModalProps = {
	room: IOmnichannelRoom;
	onClose: () => void;
	onConfirm: () => void;
};

const StartOmnichannelVideoConfModal = ({ room, onClose, onConfirm }: StartOmnichannelVideoConfModalProps): ReactElement => {
	const t = useTranslation();
	const { controllersConfig } = useVideoConfControllers();
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
					<Box mis='x8'>{room.fname}</Box>
				</VideoConfModalInfo>
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

export default StartOmnichannelVideoConfModal;
