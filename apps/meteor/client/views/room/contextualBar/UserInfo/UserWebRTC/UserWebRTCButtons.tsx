import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useWebRTCProps } from '../../../hooks/useWebRTC';

const UserWebRTCButtons = ({ webRTCData }: { webRTCData: useWebRTCProps }): ReactElement => {
	const t = useTranslation();

	const {
		handleStopCall,
		screenShareAvailable,
		toggleScreenShare,
		toggleOverlay,
		toggleVideo,
		toggleAudio,
		audioEnabled,
		videoEnabled,
		overlayEnabled,
	} = webRTCData;

	return (
		<ButtonGroup align='center'>
			<Button primary danger onClick={handleStopCall} title={t('Stop_call')}>
				<Icon size='x20' name='phone-off' />
			</Button>

			<Button onClick={toggleAudio} title={audioEnabled ? t('Mute') : t('Unmute')}>
				<Icon size='x20' name={`${audioEnabled ? 'mic' : 'mic-off'}`} />
			</Button>

			<Button onClick={toggleVideo} title={videoEnabled ? t('Hide_video') : t('Show_video')}>
				<Icon size='x20' name={`${videoEnabled ? 'eye' : 'eye-off'}`} />
			</Button>

			{screenShareAvailable && (
				<Button onClick={toggleScreenShare} title={t('Share_screen')}>
					<Icon size='x20' name='desktop' />
				</Button>
			)}

			<Button onClick={toggleOverlay} title={overlayEnabled ? t('Collapse') : t('Expand')}>
				<Icon size='x20' name={`${overlayEnabled ? 'arrow-collapse' : 'arrow-expand'}`} />
			</Button>
		</ButtonGroup>
	);
};

export default UserWebRTCButtons;
