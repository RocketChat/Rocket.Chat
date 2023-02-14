import type { IRoom } from '@rocket.chat/core-typings';
import { useOutsideClick, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupHeader,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupTitle,
	VideoConfPopupFooterButtons,
} from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { useVideoConfSetPreferences, useVideoConfCapabilities, useVideoConfPreferences } from '../../../../../../contexts/VideoConfContext';
import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';

type StartCallPopupProps = {
	id: string;
	room: IRoom;
	onClose: () => void;
	onConfirm: () => void;
	loading: boolean;
};

const StartCallPopup = ({ loading, room, onClose, onConfirm }: StartCallPopupProps): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);
	useOutsideClick([ref], !loading ? onClose : (): void => undefined);

	const t = useTranslation();
	const setPreferences = useVideoConfSetPreferences();
	const videoConfPreferences = useVideoConfPreferences();
	const { controllersConfig, handleToggleMic, handleToggleCam } = useVideoConfControllers(videoConfPreferences);
	const capabilities = useVideoConfCapabilities();

	const showCam = !!capabilities.cam;
	const showMic = !!capabilities.mic;

	const handleStartCall = useMutableCallback(() => {
		setPreferences(controllersConfig);
		onConfirm();
	});

	return (
		<VideoConfPopup ref={ref}>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Start_a_call')} />
				{(showCam || showMic) && (
					<VideoConfPopupControllers>
						{showCam && (
							<VideoConfController
								active={controllersConfig.cam}
								title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								icon={controllersConfig.cam ? 'video' : 'video-off'}
								onClick={handleToggleCam}
							/>
						)}
						{showMic && (
							<VideoConfController
								active={controllersConfig.mic}
								title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								icon={controllersConfig.mic ? 'mic' : 'mic-off'}
								onClick={handleToggleMic}
							/>
						)}
					</VideoConfPopupControllers>
				)}
			</VideoConfPopupHeader>
			<VideoConfPopupContent>
				<VideoConfPopupRoomInfo room={room} />
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
};

export default StartCallPopup;
