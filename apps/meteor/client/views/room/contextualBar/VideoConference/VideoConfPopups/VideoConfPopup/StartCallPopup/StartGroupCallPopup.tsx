import { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupTitle,
	VideoConfPopupFooterButtons,
} from '@rocket.chat/ui-video-conf';
import React, { ReactElement, forwardRef, Ref } from 'react';

import RoomAvatar from '../../../../../../../components/avatar/RoomAvatar';
import {
	useVideoConfSetPreferences,
	useVideoConfCapabilities,
	useVideoConfPreferences,
} from '../../../../../../../contexts/VideoConfContext';

type StartGroupCallPopup = {
	room: IRoom;
	onConfirm: () => void;
	loading?: boolean;
};

const StartGroupCallPopup = forwardRef(function StartGroupCallPopup(
	{ room, onConfirm, loading }: StartGroupCallPopup,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	const t = useTranslation();
	const setPreferences = useVideoConfSetPreferences();
	const videoConfPreferences = useVideoConfPreferences();
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

	const handleStartCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup ref={ref}>
			<VideoConfPopupContent>
				<RoomAvatar room={room} size='x40' />
				<VideoConfPopupTitle text={t('Start_a_call')} />
				{(showCam || showMic) && (
					<VideoConfPopupControllers>
						{showMic && (
							<VideoConfController
								active={controllersConfig.mic}
								text={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								icon={controllersConfig.mic ? 'mic' : 'mic-off'}
								onClick={handleToggleMicPref}
							/>
						)}
						{showCam && (
							<VideoConfController
								active={controllersConfig.cam}
								text={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								icon={controllersConfig.cam ? 'video' : 'video-off'}
								onClick={handleToggleCamPref}
							/>
						)}
					</VideoConfPopupControllers>
				)}
			</VideoConfPopupContent>
			<VideoConfPopupFooter>
				<VideoConfPopupFooterButtons>
					<VideoConfButton disabled={loading} primary onClick={handleStartCall}>
						{t('Start_call')}
					</VideoConfButton>
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
});

export default StartGroupCallPopup;
