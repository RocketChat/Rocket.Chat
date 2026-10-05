import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, borderRadius } from '@rocket.chat/fuselage';
import { ActionButton, ToggleButton } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import AudioDevicePicker from './AudioDevicePicker';
import CameraPicker from './CameraPicker';
import { useCallActions, useCallState } from './context';

// A device toggle and its selector fused into one control, the selector first and a shade quieter.
const deviceControlStyles = css`
	display: inline-flex;
	align-items: stretch;
	overflow: hidden;
	border-radius: ${borderRadius('medium')};

	& button {
		border-radius: 0;
	}

	& > *:first-child button {
		opacity: 0.7;
	}
`;

/** The controls of a call running in this window: devices, sharing and leaving. */
const CallControls = () => {
	const { t } = useTranslation();
	const { self, remoteParticipants } = useCallState();
	const { toggleMic, toggleCamera, toggleScreenShare, leave } = useCallActions();

	// A call with one other person is left *with* them, so it can name them; a group call has no single other side.
	const hangupLabel =
		remoteParticipants.length === 1 ? t('Voice_call__user__hangup', { user: remoteParticipants[0].displayName }) : t('Leave_call');

	return (
		<ButtonGroup>
			<Box className={deviceControlStyles}>
				<Box>
					<AudioDevicePicker />
				</Box>
				<Box>
					<ToggleButton
						label={t('Mute')}
						icons={['mic', 'mic-off']}
						titles={[t('Mute'), t('Unmute')]}
						pressed={self.muted}
						aria-pressed={self.muted}
						dangerWhenPressed
						large
						onToggle={toggleMic}
					/>
				</Box>
			</Box>
			<Box className={deviceControlStyles}>
				<Box>
					<CameraPicker />
				</Box>
				<Box>
					<ToggleButton
						label={t('Camera')}
						icons={['video', 'video-off']}
						titles={[t('Stop_camera'), t('Start_camera')]}
						pressed={!self.cameraOn}
						// Pressed as its label reads: "Camera" is pressed while the camera is on, whichever way it is drawn.
						aria-pressed={self.cameraOn}
						dangerWhenPressed
						large
						onToggle={toggleCamera}
					/>
				</Box>
			</Box>
			<ToggleButton
				label={t('Share_screen')}
				icons={['desktop-arrow-up', 'desktop-cross']}
				titles={[t('Share_screen'), t('Stop_sharing_screen')]}
				pressed={self.screenSharing}
				aria-pressed={self.screenSharing}
				large
				onToggle={toggleScreenShare}
			/>
			<ActionButton label={hangupLabel} icon='phone-off' danger large onClick={leave} />
		</ButtonGroup>
	);
};

export default CallControls;
