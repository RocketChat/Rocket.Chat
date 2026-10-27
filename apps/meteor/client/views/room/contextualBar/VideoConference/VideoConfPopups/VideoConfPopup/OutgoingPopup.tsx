import type { IRoom } from '@rocket.chat/core-typings';
import {
	VideoConfPopup,
	VideoConfPopupContent,
	useVideoConfControllers,
	VideoConfButton,
	VideoConfPopupFooter,
	VideoConfPopupFooterButtons,
	VideoConfPopupTitle,
	VideoConfPopupHeader,
	useVideoConfCapabilities,
	useVideoConfPreferences,
} from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import VideoConfPopupDeviceControllers from './VideoConfPopupDeviceControllers';
import VideoConfPopupRoomInfo from './VideoConfPopupRoomInfo';
import { useVideoConfRoomName } from '../../hooks/useVideoConfRoomName';

export type OutgoingPopupProps = {
	id: string;
	room: IRoom;
	onClose: (id: string) => void;
};

const OutgoingPopup = ({ room, onClose, id }: OutgoingPopupProps) => {
	const { t } = useTranslation();
	const videoConfPreferences = useVideoConfPreferences();
	const { controllersConfig } = useVideoConfControllers(videoConfPreferences);
	const capabilities = useVideoConfCapabilities();
	const roomName = useVideoConfRoomName(room);

	const showCam = !!capabilities.cam;
	const showMic = !!capabilities.mic;

	return (
		<VideoConfPopup aria-label={t('Calling__roomName__', { roomName })}>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Calling')} counter />
				<VideoConfPopupDeviceControllers showCam={showCam} showMic={showMic} config={controllersConfig} />
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
