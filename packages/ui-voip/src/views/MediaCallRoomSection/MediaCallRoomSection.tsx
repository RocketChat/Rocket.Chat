/* eslint-disable no-nested-ternary */
import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallStage from './CallStage';
import { ToggleButton, Timer, DevicePicker, CameraPicker, ActionButton, ActionStrip, ActionToggleChat } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRoomView from '../../context/useRoomView';
import { useAudioLevel } from '../../providers/useAudioLevel';
import { playRecordingChime, playRecordingStopChime } from '../../utils/callChimes';

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
// Header bar above the tiles: transparent strip carrying the call elapsed
// timer on the left and a row of "session-scope" controls (recording etc.)
// on the right. Visually independent of the action strip below the tiles,
// which is for "my media" controls (mic / camera / share).
const callHeaderStyles = css`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-shrink: 0;
	padding: 8px 16px;
	background: transparent;
	color: white;
	font-size: 13px;
	line-height: 1.2;
`;

const callHeaderTimerStyles = css`
	display: inline-flex;
	align-items: center;
	color: rgba(255, 255, 255, 0.85);
	font-variant-numeric: tabular-nums;
`;

// Recording pill — default state shows a static red dot + "Start recording".
// While recording, background flips to red and the dot blinks against white.
// Hovering during recording swaps the label to "Stop recording" so the
// affordance is obvious without an extra "stop" control.
const recordPillStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 28px;
	padding: 0 12px;
	border-radius: 14px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	background-color: transparent;
	color: rgba(255, 255, 255, 0.9);
	font-size: 12px;
	line-height: 1;
	cursor: pointer;
	transition:
		background-color 120ms ease,
		color 120ms ease,
		border-color 120ms ease;

	&:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: white;
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	&.recording {
		background-color: rgb(200 54 45);
		border-color: rgb(200 54 45);
		color: white;
	}

	&.recording:hover:not(:disabled) {
		background-color: rgb(168 41 33);
		border-color: rgb(168 41 33);
	}
`;

// Visual grouping for "toggle + its device chevron": tightens the gap
// between the toggle button and its adjacent device picker so they read
// as one composite control rather than two unrelated buttons. The
// chevron also nudges left slightly so it sits flush against the toggle.
const controlGroupStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 0;
`;

const chevronWrapStyles = css`
	margin-inline-start: -2px;
`;

const recordDotStyles = css`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: rgb(200 54 45);
	flex-shrink: 0;

	&.recording {
		background-color: white;
		animation: rcx-record-blink 1.2s ease-in-out infinite;
	}

	@keyframes rcx-record-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.25;
		}
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
		activeCaptions,
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
	const [recordHover, setRecordHover] = useState(false);
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const reactionPickerRef = useRef<HTMLDivElement>(null);

	// Plays a chime on every client whenever the polled recording state
	// transitions — ascending for off→on, descending mirror for on→off.
	// We track the previous value so we don't chime on the initial mount
	// (where the first poll might surface an already-running recording)
	// and so we don't double-fire when the toggle handler optimistically
	// sets the state — both the optimistic flip and the next poll
	// converge to the same value.
	const prevRecordingRef = useRef<boolean | null>(null);
	useEffect(() => {
		if (prevRecordingRef.current === null) {
			// First observation. Record the value; never chime on first paint.
			prevRecordingRef.current = isRecording;
			return;
		}
		if (prevRecordingRef.current !== isRecording) {
			if (isRecording) {
				playRecordingChime();
			} else {
				playRecordingStopChime();
			}
		}
		prevRecordingRef.current = isRecording;
	}, [isRecording]);

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
			<Box className={callHeaderStyles}>
				<Box className={callHeaderTimerStyles}>
					<Timer startAt={startedAt} />
				</Box>
				<Box
					is='button'
					type='button'
					className={[recordPillStyles, isRecording ? 'recording' : null]}
					onClick={onToggleRecording}
					disabled={recordingBusy}
					onMouseEnter={() => setRecordHover(true)}
					onMouseLeave={() => setRecordHover(false)}
					title={isRecording ? t('Stop_recording') : t('Start_recording')}
				>
					<Box is='span' aria-hidden className={[recordDotStyles, isRecording ? 'recording' : null]} />
					<Box is='span'>{isRecording ? (recordHover ? t('Stop_recording') : `${t('Recording')}…`) : t('Start_recording')}</Box>
				</Box>
			</Box>
			<CallStage
				localParticipant={localParticipant}
				remoteParticipants={remoteParticipants}
				onStopLocalScreenShare={onToggleScreenSharing}
				handPositions={handPositions}
				reactionsByParticipant={reactionsByParticipant}
				captionsByParticipant={activeCaptions}
			/>
			<ActionStrip
				rightSlot={
					!hideChatToggle ? (
						<ButtonGroup>
							<ActionToggleChat pressed={showChat} onClick={onToggleChat} />
						</ButtonGroup>
					) : undefined
				}
			>
				<Box className={controlGroupStyles}>
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<Box className={chevronWrapStyles}>
						<DevicePicker chevron />
					</Box>
				</Box>
				<Box className={controlGroupStyles}>
					<ToggleButton
						label={t('Camera')}
						icons={['video', 'video-off']}
						titles={[t('Stop_camera'), t('Start_camera')]}
						pressed={!(localCamera?.active ?? false)}
						onToggle={onToggleCamera}
					/>
					<Box className={chevronWrapStyles}>
						<CameraPicker />
					</Box>
				</Box>
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
				{isOneOnOne && !isLiveKitCall && (
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
				)}
				<ActionButton label={t('Voice_call__user__hangup', { user: hangupTarget })} icon='phone-off' danger onClick={onEndCall} />
			</ActionStrip>
		</Box>
	);
};

export default memo(MediaCallRoomSection);
