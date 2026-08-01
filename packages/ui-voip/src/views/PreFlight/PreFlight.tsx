import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Button, Palette } from '@rocket.chat/fuselage';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { PreFlightAudioMenu, PreFlightCameraMenu } from './PreFlightDeviceMenus';
import type { PreFlightJoinPreferences, PreFlightMedia } from './usePreFlightMedia';
import { usePreFlightMedia } from './usePreFlightMedia';
import { ActionStrip, JoinedButtonGroup } from '../../components';
import type { JoinedButtonGroupState } from '../../components';
import { playJoinChime } from '../../utils/callChimes';

export type { PreFlightJoinPreferences };

const previewTileStyles = css`
	width: 18.5rem;
	height: 11.75rem;
	border-radius: 0.25rem;
	overflow: hidden;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${Palette.surface['surface-neutral'].toString()};

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: scaleX(-1);
	}
`;

const micMeterTrackStyles = css`
	position: relative;
	display: inline-flex;
`;

// visual-only mic check: a thin level bar inside the mic button (spec:
// pre-flight is silent, the meter is the only feedback)
const micMeterStyles = css`
	position: absolute;
	inset-inline: 0.375rem;
	inset-block-end: 0.125rem;
	height: 0.125rem;
	border-radius: 0.0625rem;
	background: ${Palette.statusColor['status-font-on-success'].toString()};
	transform-origin: 0 50%;
	pointer-events: none;
	transition: transform 80ms linear;
`;

const PreviewTile = ({ media, avatarUrl }: { media: PreFlightMedia; avatarUrl: string }) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current && media.previewStream) {
			videoRef.current.srcObject = media.previewStream;
		}
	}, [media.previewStream]);

	return (
		<Box className={previewTileStyles}>
			{media.previewStream ? <video ref={videoRef} autoPlay playsInline muted /> : <Avatar url={avatarUrl} size='x48' />}
		</Box>
	);
};

export type PreFlightProps = {
	statusText: string;
	/** extra line under the status text (e.g. the listen-only policy copy) */
	helperText?: string;
	joinLabel: string;
	joining?: boolean;
	/** role policy forbids devices entirely — hide the device strip */
	devicesForbidden?: boolean;
	initialMic?: boolean;
	initialCam?: boolean;
	user: { id: string; displayName: string; avatarUrl: string };
	onJoin: (preferences: PreFlightJoinPreferences) => void;
};

/**
 * The pre-call screen rendered inside the pop-out call window, before any
 * media is published. Join is never disabled by device state (receive-only
 * is first-class); the only blocking state is a pending OS permission
 * prompt. Devices that are off, absent or blocked surface as danger-styled
 * toggle buttons with an explanatory tooltip — no banners here.
 */
// eslint-disable-next-line react/no-multi-comp
const PreFlight = ({
	statusText,
	helperText,
	joinLabel,
	joining = false,
	devicesForbidden = false,
	initialMic = true,
	initialCam = false,
	user,
	onJoin,
}: PreFlightProps) => {
	const { t } = useTranslation();
	const media = usePreFlightMedia(!devicesForbidden && initialMic, !devicesForbidden && initialCam);

	const micBlocked = media.micPermission === 'denied';
	const camBlocked = media.camPermission === 'denied';

	const micTitle = (() => {
		if (micBlocked) return t('Microphone_access_blocked');
		if (!media.hasMicDevice) return t('No_microphone_found');
		return media.micEnabled ? t('Mute') : t('Unmute');
	})();

	const camTitle = (() => {
		if (camBlocked) return t('Camera_access_blocked');
		if (!media.hasCamDevice) return t('No_camera_found');
		return media.camEnabled ? t('Stop_camera') : t('Start_camera');
	})();

	// device-off rule: off/blocked → danger split button; absent → single
	// danger button with no chevron (nothing to pick)
	const micState: JoinedButtonGroupState =
		(!media.hasMicDevice && 'unavailable') || (micBlocked && 'off') || (media.micEnabled ? 'on' : 'off');
	const camState: JoinedButtonGroupState =
		(!media.hasCamDevice && 'unavailable') || (camBlocked && 'off') || (media.camEnabled ? 'on' : 'off');

	const handleJoin = () => {
		// pre-flight is otherwise silent; clicking Join plays a soft local
		// confirm (the room hears its own single join blip)
		playJoinChime();
		onJoin(media.getJoinPreferences());
	};

	return (
		<Box is='section' aria-label={t('Join_call')} display='flex' flexDirection='column' w='full' h='full' bg='surface-tint'>
			<Box flexGrow={1} display='flex' flexDirection='column' alignItems='center' justifyContent='center' style={{ gap: '1.5rem' }}>
				<PreviewTile media={media} avatarUrl={user.avatarUrl} />
				<Box display='flex' flexDirection='column' alignItems='center' style={{ gap: '1rem' }} maxWidth='full' paddingInline={16}>
					<Box fontScale='p2' color='default' textAlign='center'>
						{statusText}
					</Box>
					{helperText && (
						<Box fontScale='c1' color='hint' textAlign='center'>
							{helperText}
						</Box>
					)}
					{media.prompting && (
						<Box fontScale='c1' color='hint' textAlign='center' role='status'>
							{t('Waiting_for_browser_permission')}
						</Box>
					)}
					<Button primary loading={joining} disabled={media.prompting} onClick={handleJoin} style={{ minWidth: '7.5rem' }}>
						{joinLabel}
					</Button>
				</Box>
			</Box>
			<ActionStrip>
				{!devicesForbidden && (
					<>
						<Box className={micMeterTrackStyles}>
							<JoinedButtonGroup
								state={micState}
								label={t('Mute')}
								icons={['mic', 'mic-off']}
								title={micTitle}
								onToggle={media.toggleMic}
								menu={
									<PreFlightAudioMenu
										audioInputs={media.audioInputs}
										audioOutputs={media.audioOutputs}
										selectedInputId={media.selectedAudioInputId}
										selectedOutputId={media.selectedAudioOutputId}
										onSelectInput={media.selectAudioInput}
										onSelectOutput={media.selectAudioOutput}
									/>
								}
							/>
							{media.micEnabled && media.micLevel > 0 && (
								<Box className={micMeterStyles} style={{ transform: `scaleX(${Math.min(1, media.micLevel)})` }} />
							)}
						</Box>
						<JoinedButtonGroup
							state={camState}
							label={t('Camera')}
							icons={['video', 'video-off']}
							title={camTitle}
							onToggle={media.toggleCam}
							menu={
								<PreFlightCameraMenu
									videoInputs={media.videoInputs}
									selectedId={media.selectedVideoInputId}
									onSelect={media.selectVideoInput}
								/>
							}
						/>
					</>
				)}
			</ActionStrip>
		</Box>
	);
};

export default PreFlight;
