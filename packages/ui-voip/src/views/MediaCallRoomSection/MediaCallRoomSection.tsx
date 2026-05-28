import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ToggleButton,
	Timer,
	DevicePicker,
	ActionButton,
	CardListContainer,
	CardListSection,
	PeerCard,
	StreamCard,
	useShouldWrapCards,
	CARD_LIST_SECTION_MAX_HEIGHT,
	ActionStrip,
	ActionToggleChat,
} from '../../components';
import { useMediaCallView, type RemoteParticipantInfo } from '../../context/MediaCallViewContext';
import useRoomView from '../../context/useRoomView';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

/**
 * Cards for a single remote participant: their avatar tile (with embedded
 * camera video if active) and, when present, a separate StreamCard for their
 * screen share.
 */
const ParticipantCards = ({ participant }: { participant: RemoteParticipantInfo }) => {
	const [cameraRefCallback] = usePlayMediaStream(participant.cameraStream ?? null);
	const [screenRefCallback] = usePlayMediaStream(participant.screenStream ?? null);
	const cameraActive = Boolean(participant.cameraStream);
	const screenActive = Boolean(participant.screenStream);
	return (
		<>
			<PeerCard
				displayName={participant.displayName}
				avatarUrl={participant.avatarUrl}
				muted={participant.muted}
				held={participant.held}
				videoActive={cameraActive}
				videoRef={cameraRefCallback}
			/>
			{screenActive && (
				<StreamCard autoHeight maxHeight={240}>
					<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={screenRefCallback}>
						<track kind='captions' />
					</video>
				</StreamCard>
			)}
		</>
	);
};

type MediaCallRoomSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		displayName: string;
		avatarUrl: string;
	};
	containerHeight: number;
};

const getSplitStyles = (showChat?: boolean) => {
	if (showChat) {
		return {
			maxHeight: `${CARD_LIST_SECTION_MAX_HEIGHT}vh`,
		};
	}
	return {
		height: '100%',
		// This is a workaround to match the border height with the sidebar footer
		// The sidebar footer uses a divider instead of a border, so it's 1px taller than it should be.
		paddingBlockEnd: '1px',
	};
};

const MediaCallRoomSection = ({ showChat, onToggleChat, user, containerHeight }: MediaCallRoomSectionProps) => {
	const { t } = useTranslation();

	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onToggleScreenSharing,
		onToggleCamera,
		streams: { localScreen, localCamera },
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
			} catch {}
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

	const shouldWrapCards = useShouldWrapCards(showChat, containerHeight);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const [localStreamRefCallback] = usePlayMediaStream(localScreen?.stream ?? null);
	const [localCameraRefCallback] = usePlayMediaStream(localCamera?.stream ?? null);

	useRoomView();

	const localStreamCard = localScreen?.active ? (
		<StreamCard own onClickStopSharing={onToggleScreenSharing} showStopSharingOnHover>
			<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={localStreamRefCallback}>
				<track kind='captions' />
			</video>
		</StreamCard>
	) : null;

	return (
		<Box
			id='outer-element'
			w='full'
			bg='surface-tint'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			{...getSplitStyles(showChat)}
		>
			<CardListSection>
				<CardListContainer shouldWrapCards={shouldWrapCards}>
					<PeerCard
						displayName={user.displayName}
						avatarUrl={user.avatarUrl}
						muted={muted}
						held={held}
						videoActive={localCamera?.active ?? false}
						videoRef={localCameraRefCallback}
						mirrored
						muteVideoAudio
					/>
					{remoteParticipants.map((p) => (
						<ParticipantCards key={p.id} participant={p} />
					))}
					{localStreamCard}
				</CardListContainer>
			</CardListSection>
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
					titles={[t('Start_camera'), t('Stop_camera')]}
					pressed={localCamera?.active ?? false}
					onToggle={onToggleCamera}
				/>
				<ToggleButton
					label={t('Record')}
					icons={['circle-cross', 'circle-cross']}
					titles={[t('Start_recording'), t('Stop_recording')]}
					pressed={isRecording}
					onToggle={onToggleRecording}
				/>
				{isOneOnOne && (
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
				)}
				<ActionButton
					label={t('Voice_call__user__hangup', { user: hangupTarget })}
					icon='phone-off'
					danger
					onClick={onEndCall}
				/>
			</ActionStrip>
		</Box>
	);
};

export default memo(MediaCallRoomSection);
