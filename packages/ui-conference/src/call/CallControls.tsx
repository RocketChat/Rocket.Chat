import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, Palette, borderRadius } from '@rocket.chat/fuselage';
import { ActionButton, ToggleButton } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import AudioDevicePicker from './AudioDevicePicker';
import CameraPicker from './CameraPicker';
import { useCallActions, useCallState } from './context';

const speakingWhileMutedTooltip = css`
	@keyframes swm-fade-in {
		from {
			opacity: 0;
			transform: translateY(0.25rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	padding: 0.5rem 0.75rem;
	border-radius: ${borderRadius('medium')};
	background: ${Palette.badge['badge-background-level-4'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
	white-space: nowrap;
	pointer-events: auto;
	cursor: pointer;
	animation: swm-fade-in 200ms ease-out;
`;

/** What a control can raise above the strip: the muted-while-talking notice, centred on the row so it stays on screen. */
const controlNoticesStyles = css`
	position: absolute;
	bottom: calc(100% + 0.5rem);
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;

	/* Above the buttons in the row, and below the side panels (100), which it must not paint over. */
	z-index: 10;

	pointer-events: none;

	& > * {
		pointer-events: auto;
	}
`;

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
		<ButtonGroup style={{ position: 'relative' }}>
			<Box className={deviceControlStyles}>
				<Box>
					<AudioDevicePicker />
				</Box>
				<Box>
					<ToggleButton
						label={t('Mute')}
						icons={['mic', 'mic-off']}
						titles={self.speakingWhileMuted ? [t('You_are_muted'), t('You_are_muted')] : [t('Mute'), t('Unmute')]}
						pressed={self.muted}
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
				large
				onToggle={toggleScreenShare}
			/>
			<ActionButton label={hangupLabel} icon='phone-off' danger large onClick={leave} />
			{self.speakingWhileMuted && (
				<Box className={controlNoticesStyles}>
					<Box className={speakingWhileMutedTooltip} fontScale='c1' onClick={toggleMic}>
						{t('You_are_muted')}
					</Box>
				</Box>
			)}
		</ButtonGroup>
	);
};

export default CallControls;
