import { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupTitle,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement } from 'react';

import ReactiveUserStatus from '../../../../../../components/UserStatus/ReactiveUserStatus';
import RoomAvatar from '../../../../../../components/avatar/RoomAvatar';
import { useVideoConfSetPreferences, useVideoConfCapabilities, useVideoConfPreferences } from '../../../../../../contexts/VideoConfContext';

type CallingPopupProps = {
	id: string;
	room: IRoom;
	onClose: (id: string) => void;
};

// TODO: Replace RoomAvatar to UserAvatar and avoid using subscription???
const CallingPopup = ({ room, onClose, id }: CallingPopupProps): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const videoConfPreferences = useVideoConfPreferences();
	const setPreferences = useVideoConfSetPreferences();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers(videoConfPreferences);
	const capabilities = useVideoConfCapabilities();

	const showCam = !!capabilities.cam;
	const showMic = !!capabilities.mic;

	const handleToggleMicPref = useMutableCallback(() => {
		handleToggleMic();
		setPreferences({ mic: !controllersConfig.mic });
	});

	const handleToggleCamPref = useMutableCallback(() => {
		handleToggleCam();
		setPreferences({ cam: !controllersConfig.cam });
	});

	return (
		<VideoConfPopup>
			<VideoConfPopupContent>
				<RoomAvatar room={room} size='x40' />
				<VideoConfPopupTitle text='Calling' icon='phone-out' counter />
				{directUserId && (
					<Box display='flex' alignItems='center' mbs='x8'>
						<ReactiveUserStatus uid={directUserId} />
						<Box mis='x8' display='flex'>
							<Box>{room.fname}</Box>
							<Box mis='x4' color='neutral-600'>
								{`(${room.name})`}
							</Box>
						</Box>
					</Box>
				)}
				{(showCam || showMic) && (
					<VideoConfPopupControllers>
						{showMic && (
							<VideoConfController
								primary={controllersConfig.mic}
								text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								icon={controllersConfig.mic ? 'mic' : 'mic-off'}
								onClick={handleToggleMicPref}
							/>
						)}
						{showCam && (
							<VideoConfController
								primary={controllersConfig.cam}
								text={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								icon={controllersConfig.cam ? 'video' : 'video-off'}
								onClick={handleToggleCamPref}
							/>
						)}
					</VideoConfPopupControllers>
				)}
				<VideoConfPopupFooter>
					{onClose && (
						<VideoConfButton primary icon='phone-disabled' onClick={(): void => onClose(id)}>
							{t('Cancel')}
						</VideoConfButton>
					)}
				</VideoConfPopupFooter>
			</VideoConfPopupContent>
		</VideoConfPopup>
	);
};

export default CallingPopup;
