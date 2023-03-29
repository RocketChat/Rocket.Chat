import type { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	VideoConfPopupControllers,
	VideoConfController,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupFooterButtons,
	VideoConfPopupTitle,
	VideoConfPopupHeader,
} from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import React from 'react';

import { useVideoConfCapabilities, useVideoConfPreferences } from '../../../../../../contexts/VideoConfContext';
import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';

type OutgoingPopupProps = {
	id: string;
	room: IRoom;
	onClose: (id: string) => void;
};

const OutgoingPopup = ({ room, onClose, id }: OutgoingPopupProps): ReactElement => {
	const t = useTranslation();
	const videoConfPreferences = useVideoConfPreferences();
	const { controllersConfig } = useVideoConfControllers(videoConfPreferences);
	const capabilities = useVideoConfCapabilities();

	const showCam = !!capabilities.cam;
	const showMic = !!capabilities.mic;

	return (
		<VideoConfPopup>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Calling')} counter />
				{(showCam || showMic) && (
					<VideoConfPopupControllers>
						{showCam && (
							<VideoConfController
								active={controllersConfig.cam}
								title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
								icon={controllersConfig.cam ? 'video' : 'video-off'}
								disabled
							/>
						)}
						{showMic && (
							<VideoConfController
								active={controllersConfig.mic}
								title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
								icon={controllersConfig.mic ? 'mic' : 'mic-off'}
								disabled
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
					{onClose && <VideoConfButton onClick={(): void => onClose(id)}>{t('Cancel')}</VideoConfButton>}
				</VideoConfPopupFooterButtons>
			</VideoConfPopupFooter>
		</VideoConfPopup>
	);
};

export default OutgoingPopup;
