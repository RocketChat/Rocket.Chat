import { VideoConfController, VideoConfPopupControllers } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

type VideoConfPopupDeviceControllersProps = {
	showCam: boolean;
	showMic: boolean;
	config: { cam?: boolean; mic?: boolean };
	/** Without handlers the controllers only show the choice, disabled. */
	onToggleCam?: () => void;
	onToggleMic?: () => void;
};

/** The camera and microphone a call is joined with, as a popup's header shows them. */
const VideoConfPopupDeviceControllers = ({ showCam, showMic, config, onToggleCam, onToggleMic }: VideoConfPopupDeviceControllersProps) => {
	const { t } = useTranslation();

	if (!showCam && !showMic) {
		return null;
	}

	return (
		<VideoConfPopupControllers>
			{showCam && (
				<VideoConfController
					active={config.cam}
					title={config.cam ? t('Cam_on') : t('Cam_off')}
					icon={config.cam ? 'video' : 'video-off'}
					disabled={!onToggleCam}
					onClick={onToggleCam}
				/>
			)}
			{showMic && (
				<VideoConfController
					active={config.mic}
					title={config.mic ? t('Mic_on') : t('Mic_off')}
					icon={config.mic ? 'mic' : 'mic-off'}
					disabled={!onToggleMic}
					onClick={onToggleMic}
				/>
			)}
		</VideoConfPopupControllers>
	);
};

export default VideoConfPopupDeviceControllers;
