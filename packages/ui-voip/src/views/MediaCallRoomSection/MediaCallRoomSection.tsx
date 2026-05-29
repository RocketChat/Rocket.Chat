import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallStage from './CallStage';
import { ToggleButton, Timer, DevicePicker, ActionButton, ActionStrip, ActionToggleChat } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRoomView from '../../context/useRoomView';

type MediaCallRoomSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		id: string;
		displayName: string;
		avatarUrl: string;
	};
};

const MediaCallRoomSection = ({ showChat, onToggleChat, user }: MediaCallRoomSectionProps) => {
	const { t } = useTranslation();

	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onToggleScreenSharing,
		onToggleCamera,
		streams: { localScreen, localCamera, localMicrophone },
		remoteParticipants,
	} = useMediaCallView();

	const { muted, held, connectionState, startedAt, callId } = sessionState;
	const isOneOnOne = remoteParticipants.length === 1;
	const hangupTarget = isOneOnOne ? remoteParticipants[0].displayName : t('Call');

	const [isRecording, setIsRecording] = useState(false);
	const [recordingBusy, setRecordingBusy] = useState(false);

	useEffect(() => {
		if (!callId) return;
		let cancelled = false;
		const fetchStatus = async () => {
			try {
				const res = await fetch(`/api/v1/media-calls.livekit.recording-status?callId=${encodeURIComponent(callId)}`, {
					headers: {
						'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
						'X-User-Id': localStorage.getItem('Meteor.userId') || '',
					},
				});
				if (!res.ok || cancelled) return;
				const data = await res.json();
				setIsRecording(Boolean(data.recording));
			} catch {
				// recording status is best-effort; transient fetch failures are non-fatal
			}
		};
		void fetchStatus();
		const interval = setInterval(fetchStatus, 5000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [callId]);

	const onToggleRecording = useCallback(async () => {
		if (!callId || recordingBusy) return;
		setRecordingBusy(true);
		try {
			const endpoint = isRecording ? '/api/v1/media-calls.livekit.stop-recording' : '/api/v1/media-calls.livekit.start-recording';
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
					'X-User-Id': localStorage.getItem('Meteor.userId') || '',
				},
				body: JSON.stringify({ callId }),
			});
			if (res.ok) {
				setIsRecording(!isRecording);
			}
		} finally {
			setRecordingBusy(false);
		}
	}, [callId, isRecording, recordingBusy]);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	useRoomView();

	const localParticipant = {
		id: user.id || 'local',
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		muted,
		held,
		cameraStream: localCamera?.stream ?? null,
		screenStream: localScreen?.active ? (localScreen?.stream ?? null) : null,
		audioStream: localMicrophone?.stream ?? null,
	};

	return (
		<Box w='full' h='full' bg='surface-tint' overflow='hidden' display='flex' flexDirection='column' minHeight={0}>
			<CallStage
				localParticipant={localParticipant}
				remoteParticipants={remoteParticipants}
				onStopLocalScreenShare={onToggleScreenSharing}
			/>
			<ActionStrip
				leftSlot={
					<Box color='default' alignContent='center' pis={16}>
						<Timer startAt={startedAt} />
					</Box>
				}
				rightSlot={
					<ButtonGroup>
						<ActionToggleChat pressed={showChat} onClick={onToggleChat} />
						<DevicePicker secondary />
					</ButtonGroup>
				}
			>
				<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
				<ToggleButton
					label={t('Hold')}
					icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
					titles={[t('Hold'), t('Resume')]}
					pressed={held}
					onToggle={onHold}
				/>
				<ToggleButton
					label={t('Share_screen')}
					icons={['desktop-arrow-up', 'desktop-cross']}
					titles={[t('Share_screen'), t('Stop_sharing_screen')]}
					pressed={localScreen?.active ?? false}
					onToggle={onToggleScreenSharing}
				/>
				<ToggleButton
					label={t('Camera')}
					icons={['video', 'video-off']}
					titles={[t('Stop_camera'), t('Start_camera')]}
					pressed={!(localCamera?.active ?? false)}
					onToggle={onToggleCamera}
				/>
				<ToggleButton
					label={t('Record')}
					icons={['circle-cross', 'circle-cross']}
					titles={[t('Start_recording'), t('Stop_recording')]}
					pressed={isRecording}
					onToggle={onToggleRecording}
				/>
				{isOneOnOne && <ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />}
				<ActionButton label={t('Voice_call__user__hangup', { user: hangupTarget })} icon='phone-off' danger onClick={onEndCall} />
			</ActionStrip>
		</Box>
	);
};

export default memo(MediaCallRoomSection);
