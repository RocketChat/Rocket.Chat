import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallStage from './CallStage';
import { ToggleButton, Timer, DevicePicker, ActionButton, ActionStrip, ActionToggleChat } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRoomView from '../../context/useRoomView';
import { useAudioLevel } from '../../providers/useAudioLevel';

// Speaking threshold used to auto-lower a raised hand. Mirrors the visual
// threshold in CallTile so the auto-lower triggers on the same "actually
// speaking" signal users see.
const SPEAKING_THRESHOLD = 0.12;

// Reactions shown in the picker — matches Google Meet's defaults so users
// don't need to learn a new vocabulary.
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🤔', '🙏'];

const reactionPickerWrapStyles = css`
	position: relative;
`;

const reactionPickerStyles = css`
	position: absolute;
	bottom: 48px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	gap: 4px;
	padding: 8px;
	background-color: rgba(20, 20, 25, 0.95);
	border-radius: 10px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	z-index: 5;
`;

const reactionButtonStyles = css`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 8px;
	border: none;
	background: transparent;
	color: white;
	font-size: 24px;
	line-height: 1;
	cursor: pointer;
	transition: background-color 80ms ease;

	&:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}
`;
// Tolerance for natural inter-word pauses. As long as we hear speech again
// within this window, the auto-lower timer keeps counting — without this,
// every breath between sentences would reset the 3s countdown.
const SPEAKING_GAP_TOLERANCE_MS = 800;
// User must speak (with the gap tolerance above) for this long while their
// hand is raised before the hand drops automatically. Tuned to "you got the floor".
const AUTO_LOWER_AFTER_MS = 3000;

type MediaCallRoomSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		id: string;
		displayName: string;
		avatarUrl: string;
	};
	/** When true, suppresses the chat-toggle button (used by the floating widget which has no chat slot). */
	hideChatToggle?: boolean;
};

const MediaCallRoomSection = ({ showChat, onToggleChat, user, hideChatToggle }: MediaCallRoomSectionProps) => {
	const { t } = useTranslation();

	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onToggleScreenSharing,
		onToggleCamera,
		onToggleHand,
		localHandRaised,
		raisedHands,
		onSendReaction,
		activeReactions,
		streams: { localScreen, localCamera, localMicrophone },
		remoteParticipants,
	} = useMediaCallView();

	const { muted, held, connectionState, startedAt, callId } = sessionState;
	const isOneOnOne = remoteParticipants.length === 1;
	const hangupTarget = isOneOnOne ? remoteParticipants[0].displayName : t('Call');
	// LK group calls don't support Hold (no SIP-style hold concept) and don't
	// support Forward (no caller/callee transfer model). onToggleHand is only
	// wired up by LiveKitMediaCallProvider, so its presence is a reliable
	// "this is an LK call" signal without threading another prop through.
	const isLiveKitCall = Boolean(onToggleHand);

	const [isRecording, setIsRecording] = useState(false);
	const [recordingBusy, setRecordingBusy] = useState(false);
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const reactionPickerRef = useRef<HTMLDivElement>(null);

	// Click-outside dismiss for the reaction popover. Stays open while the
	// user clicks emojis inside it (so they can send several in a row), but
	// closes when they click anywhere else on the page.
	useEffect(() => {
		if (!reactionPickerOpen) return undefined;
		const onPointerDown = (e: PointerEvent) => {
			const node = reactionPickerRef.current;
			if (node && !node.contains(e.target as Node)) {
				setReactionPickerOpen(false);
			}
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [reactionPickerOpen]);

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
		// Only expose the stream when the transport flagged it active. LK's
		// setCameraEnabled(false) keeps the MediaStream reference alive but
		// stops producing frames — without this gate the tile would render a
		// black <video> element instead of the avatar.
		cameraStream: localCamera?.active ? (localCamera?.stream ?? null) : null,
		screenStream: localScreen?.active ? (localScreen?.stream ?? null) : null,
		audioStream: localMicrophone?.stream ?? null,
	};

	// Map participant id → 1-based queue position for the raise-hand badge.
	const handPositions = useMemo(() => {
		const out: Record<string, number> = {};
		(raisedHands ?? []).forEach((h, i) => {
			out[h.id] = i + 1;
		});
		return out;
	}, [raisedHands]);

	// Group active reactions by participant so CallStage can hand each tile
	// just its own list. The provider's auto-expiry keeps the arrays bounded.
	const reactionsByParticipant = useMemo(() => {
		const out: Record<string, { id: string; emoji: string }[]> = {};
		(activeReactions ?? []).forEach((r) => {
			if (!out[r.participantId]) out[r.participantId] = [];
			out[r.participantId].push({ id: r.id, emoji: r.emoji });
		});
		return out;
	}, [activeReactions]);

	// Auto-lower the local hand after AUTO_LOWER_AFTER_MS of (mostly continuous)
	// speech — once the user has "the floor", they don't need the hand up any
	// more. Natural inter-word pauses up to SPEAKING_GAP_TOLERANCE_MS don't
	// cancel the timer. The hook only runs while the hand is up.
	const localMicForAutoLower = localHandRaised ? (localMicrophone?.stream ?? null) : null;
	const liveLevel = useAudioLevel(localMicForAutoLower);
	const autoLowerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSpeakingAtRef = useRef(0);
	useEffect(() => {
		if (!localHandRaised || !onToggleHand) {
			if (autoLowerTimerRef.current) {
				clearTimeout(autoLowerTimerRef.current);
				autoLowerTimerRef.current = null;
			}
			lastSpeakingAtRef.current = 0;
			return;
		}
		const now = Date.now();
		const speakingNow = liveLevel > SPEAKING_THRESHOLD;
		if (speakingNow) {
			lastSpeakingAtRef.current = now;
			if (!autoLowerTimerRef.current) {
				autoLowerTimerRef.current = setTimeout(() => {
					autoLowerTimerRef.current = null;
					onToggleHand();
				}, AUTO_LOWER_AFTER_MS);
			}
			return;
		}
		// Below threshold: cancel only if the gap exceeds the tolerance.
		// Brief pauses between words keep the timer ticking.
		if (autoLowerTimerRef.current && lastSpeakingAtRef.current > 0 && now - lastSpeakingAtRef.current > SPEAKING_GAP_TOLERANCE_MS) {
			clearTimeout(autoLowerTimerRef.current);
			autoLowerTimerRef.current = null;
			lastSpeakingAtRef.current = 0;
		}
	}, [liveLevel, localHandRaised, onToggleHand]);

	return (
		<Box w='full' h='full' bg='surface-tint' overflow='hidden' display='flex' flexDirection='column' minHeight={0}>
			<CallStage
				localParticipant={localParticipant}
				remoteParticipants={remoteParticipants}
				onStopLocalScreenShare={onToggleScreenSharing}
				handPositions={handPositions}
				reactionsByParticipant={reactionsByParticipant}
			/>
			<ActionStrip
				leftSlot={
					<Box color='default' alignContent='center' pis={16}>
						<Timer startAt={startedAt} />
					</Box>
				}
				rightSlot={
					<ButtonGroup>
						{!hideChatToggle && <ActionToggleChat pressed={showChat} onClick={onToggleChat} />}
						<DevicePicker secondary />
					</ButtonGroup>
				}
			>
				<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
				{!isLiveKitCall && (
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
				)}
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
				{onToggleHand && (
					<ToggleButton
						label='Raise hand'
						icons={['hand-pointer', 'hand-pointer']}
						titles={['Raise hand', 'Lower hand']}
						pressed={Boolean(localHandRaised)}
						onToggle={onToggleHand}
					/>
				)}
				{onSendReaction && (
					<Box className={reactionPickerWrapStyles} ref={reactionPickerRef}>
						<ToggleButton
							label='Send reaction'
							icons={['emoji', 'emoji']}
							titles={['Send reaction', 'Send reaction']}
							pressed={reactionPickerOpen}
							onToggle={() => setReactionPickerOpen((p) => !p)}
						/>
						{reactionPickerOpen && (
							<Box className={reactionPickerStyles}>
								{REACTION_EMOJIS.map((emoji) => (
									<Box
										key={emoji}
										is='button'
										type='button'
										title={`Send ${emoji}`}
										className={reactionButtonStyles}
										onClick={() => onSendReaction(emoji)}
									>
										{emoji}
									</Box>
								))}
							</Box>
						)}
					</Box>
				)}
				<ToggleButton
					label={t('Record')}
					icons={['circle-cross', 'circle-cross']}
					titles={[t('Start_recording'), t('Stop_recording')]}
					pressed={isRecording}
					onToggle={onToggleRecording}
				/>
				{isOneOnOne && !isLiveKitCall && (
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
				)}
				<ActionButton label={t('Voice_call__user__hangup', { user: hangupTarget })} icon='phone-off' danger onClick={onEndCall} />
			</ActionStrip>
		</Box>
	);
};

export default memo(MediaCallRoomSection);
