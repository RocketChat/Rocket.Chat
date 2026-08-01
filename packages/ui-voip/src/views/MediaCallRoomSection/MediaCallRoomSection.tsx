import { css } from '@rocket.chat/css-in-js';
import { Banner, Box, ButtonGroup, Icon, IconButton } from '@rocket.chat/fuselage';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CallStage from './CallStage';
import {
	ToggleButton,
	Timer,
	DevicePicker,
	CameraPicker,
	ActionButton,
	ActionStrip,
	ActionToggleChat,
	JoinedButtonGroup,
	CaptionsLanguageMenu,
} from '../../components';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';
import { useAudioLevel } from '../../providers/useAudioLevel';
import { playReconnectedTone, playReconnectingTone, playRecordingChime, playRecordingStopChime } from '../../utils/callChimes';
import { CALL_LANGUAGES, DEFAULT_CALL_LANGUAGE } from '../../utils/callLanguages';
import PopoutDockPrompt from '../PopoutDockPrompt';

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

// Right-hand cluster of DS icon buttons in the call header.
const headerActionsRowStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 8px;
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
	/** Optional chat panel rendered inside the call surface when showChat is true. */
	children?: ReactNode;
	/** Number of unread messages in the chat panel, shown as a badge on the toggle button. */
	unreadCount?: number;
};

const MediaCallRoomSection = ({ showChat, onToggleChat, user, hideChatToggle, children, unreadCount }: MediaCallRoomSectionProps) => {
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
		onOpenPopout,
		onClosePopout,
		localHandRaised,
		raisedHands,
		onSendReaction,
		activeReactions,
		activeCaptions,
		captionsEnabledLocally,
		onToggleCaptions,
		callLanguage,
		onChangeCallLanguage,
		liveRecordingActive,
		liveTranscriptionActive,
		broadcastRecordingState,
		broadcastTranscriptionState,
		streams: { localScreen, localCamera, localMicrophone },
		remoteParticipants: remoteParticipantsRaw,
	} = useMediaCallView();
	const { currentViews } = useMediaCallInstance();
	const isPopout = currentViews.includes('popout');

	useRegisterView('room');

	// Optional on the context — only the VC LiveKit bridge populates it. The
	// 1:1 VoIP path doesn't render this component so the fallback to [] is
	// purely defensive.
	const remoteParticipants = remoteParticipantsRaw ?? [];

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

	const currentLanguage = callLanguage
		? (CALL_LANGUAGES.find((l) => l.code === callLanguage.code) ?? DEFAULT_CALL_LANGUAGE)
		: DEFAULT_CALL_LANGUAGE;

	// Take-notes state: `available` reflects workspace setting + agent mode
	// (true if the server has the feature configured), `enabled` is the
	// per-call toggle. Both come from the polled status endpoint so users
	// see each other's toggle changes within ~5s.
	const [notesAvailable, setNotesAvailable] = useState(false);
	const [notesEnabled, setNotesEnabled] = useState(false);
	const [notesBusy, setNotesBusy] = useState(false);

	// Fullscreen target is the call section's root. We listen to
	// `fullscreenchange` rather than tracking state purely through the
	// toggle handler, so we react to the user pressing Esc (which the
	// browser handles without calling our handler) and to programmatic
	// exits from other parts of the app.
	const rootRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	useEffect(() => {
		const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	}, []);
	const onToggleFullscreen = useCallback(() => {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => undefined);
			return;
		}
		const node = rootRef.current;
		if (!node) return;
		void node.requestFullscreen().catch(() => undefined);
	}, []);

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

	// One-shot fetch on call join to seed the recording state. After that,
	// changes propagate over the LK data channel (see liveRecordingActive
	// sync effect below) — no polling, no 5s lag.
	useEffect(() => {
		if (!callId) return;
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(`/api/v1/video-conference.livekit.recording.status?callId=${encodeURIComponent(callId)}`, {
					headers: {
						'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
						'X-User-Id': localStorage.getItem('Meteor.userId') || '',
					},
				});
				if (!res.ok || cancelled) return;
				const data = await res.json();
				setIsRecording(Boolean(data.recording));
			} catch {
				/* best-effort */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [callId]);

	// React to recording-state broadcasts from other participants. Whoever
	// flips the recording pill broadcasts via the LK data channel; the
	// provider stashes it in liveRecordingActive; we sync local UI.
	useEffect(() => {
		if (liveRecordingActive) setIsRecording(liveRecordingActive.isRecording);
	}, [liveRecordingActive]);

	const onToggleRecording = useCallback(async () => {
		if (!callId || recordingBusy) return;
		setRecordingBusy(true);
		try {
			const endpoint = isRecording ? '/api/v1/video-conference.livekit.recording.stop' : '/api/v1/video-conference.livekit.recording.start';
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
				const next = !isRecording;
				setIsRecording(next);
				// Tell other participants over the LK data channel so they
				// flip the pill without waiting for a poll tick.
				broadcastRecordingState?.(next);
			}
		} finally {
			setRecordingBusy(false);
		}
	}, [callId, isRecording, recordingBusy, broadcastRecordingState]);

	// One-shot fetch on call join to seed transcription state + availability.
	// `available` is a workspace-level toggle (Summary feature on + agent
	// embedded) that doesn't change mid-call, so a single fetch is enough.
	// `enabled` (per-call) is then kept in sync via the data channel.
	useEffect(() => {
		if (!callId) return;
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(`/api/v1/video-conference.livekit.transcription.status?callId=${encodeURIComponent(callId)}`, {
					headers: {
						'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
						'X-User-Id': localStorage.getItem('Meteor.userId') || '',
					},
				});
				if (!res.ok || cancelled) return;
				const data = await res.json();
				setNotesAvailable(Boolean(data.available));
				setNotesEnabled(Boolean(data.enabled));
				// Seed the data-channel-synced state so the agent (which
				// only learns via data channel) sees take-notes-on for
				// late joiners. broadcastTranscriptionState publishes AND
				// updates the local liveTranscriptionActive on the LK
				// provider, which in turn drives the ParticipantConnected
				// rebroadcast so future joiners pick it up.
				if (data.enabled) broadcastTranscriptionState?.(true);
			} catch {
				/* best-effort */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [callId, broadcastTranscriptionState]);

	// React to transcription-state broadcasts from other participants.
	useEffect(() => {
		if (liveTranscriptionActive) setNotesEnabled(liveTranscriptionActive.enabled);
	}, [liveTranscriptionActive]);

	const onToggleTakeNotes = useCallback(async () => {
		if (!callId || notesBusy) return;
		setNotesBusy(true);
		try {
			const endpoint = notesEnabled
				? '/api/v1/video-conference.livekit.transcription.stop'
				: '/api/v1/video-conference.livekit.transcription.start';
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
				const next = !notesEnabled;
				setNotesEnabled(next);
				broadcastTranscriptionState?.(next);
			}
		} finally {
			setNotesBusy(false);
		}
	}, [callId, notesEnabled, notesBusy, broadcastTranscriptionState]);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	// Reconnecting is a window-level condition → DS Banner pinned to the top
	// of the call window (never an app toast). Dismissible; re-arms on the
	// next reconnect. Audio: one alert tone at onset, silence during retries,
	// a soft confirm on recovery — never loop error sounds.
	const [reconnectBannerDismissed, setReconnectBannerDismissed] = useState(false);
	const wasReconnectingRef = useRef(false);
	useEffect(() => {
		if (isPopout) {
			return;
		}
		if (reconnecting && !wasReconnectingRef.current) {
			wasReconnectingRef.current = true;
			setReconnectBannerDismissed(false);
			playReconnectingTone();
			return;
		}
		if (!reconnecting && wasReconnectingRef.current) {
			wasReconnectingRef.current = false;
			if (connectionState === 'CONNECTED') {
				playReconnectedTone();
			}
		}
	}, [reconnecting, connectionState, isPopout]);

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

	if (isPopout) {
		return (
			<Box
				ref={rootRef}
				is='section'
				aria-label={t('Voice_call')}
				w='full'
				h='full'
				bg='surface-tint'
				overflow='hidden'
				display='flex'
				flexDirection='column'
				minHeight={0}
			>
				<PopoutDockPrompt onClosePopout={onClosePopout} />
			</Box>
		);
	}

	return (
		<Box
			ref={rootRef}
			is='section'
			aria-label={t('Voice_call')}
			w='full'
			h='full'
			bg='surface-tint'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			minHeight={0}
		>
			{reconnecting && !reconnectBannerDismissed && (
				<Banner
					variant='danger'
					icon={<Icon name='ban' size='x24' />}
					title={t('Connection_lost')}
					closeable
					onClose={() => setReconnectBannerDismissed(true)}
				>
					{t('Trying_to_reconnect_your_devices_stay_as_they_were')}
				</Banner>
			)}
			<Box className={callHeaderStyles}>
				<Box className={callHeaderTimerStyles}>
					<Timer startAt={startedAt} />
				</Box>
				{/* Header Actions cluster (Figma): DS icon buttons only — active
				    tool state is lit Primary, recording flips to danger. The
				    red call Timer on the left stays the persistent indicator. */}
				<Box className={headerActionsRowStyles}>
					{/* Recording is a Video Conference (LiveKit) feature — the
					    button only renders when the upstream provider supplies
					    a broadcastRecordingState. */}
					{broadcastRecordingState && (
						<IconButton
							small
							secondary
							danger={isRecording}
							icon={<Icon size={16} name='rec' />}
							label={isRecording ? t('Stop_recording') : t('Start_recording')}
							aria-label={isRecording ? t('Stop_recording') : t('Start_recording')}
							title={isRecording ? t('Stop_recording') : t('Start_recording')}
							aria-pressed={isRecording}
							disabled={recordingBusy}
							onClick={onToggleRecording}
						/>
					)}
					{notesAvailable && (
						<IconButton
							small
							secondary={!notesEnabled}
							primary={notesEnabled}
							icon={<Icon size={16} name='pencil' />}
							label={notesEnabled ? t('Stop_taking_notes') : t('Take_notes')}
							aria-label={notesEnabled ? t('Stop_taking_notes') : t('Take_notes')}
							title={notesEnabled ? t('Stop_taking_notes') : t('Take_notes')}
							aria-pressed={notesEnabled}
							disabled={notesBusy}
							onClick={onToggleTakeNotes}
						/>
					)}
					<IconButton
						small
						secondary
						icon={<Icon size={16} name={isFullscreen ? 'arrow-collapse' : 'arrow-expand'} />}
						label={isFullscreen ? t('Exit_fullscreen') : t('Enter_fullscreen')}
						aria-label={isFullscreen ? t('Exit_fullscreen') : t('Enter_fullscreen')}
						title={isFullscreen ? t('Exit_fullscreen') : t('Enter_fullscreen')}
						onClick={onToggleFullscreen}
					/>
				</Box>
			</Box>
			<Box display='flex' flexDirection='row' flexGrow={1} minWidth={0} minHeight={0} overflow='hidden'>
				<Box flexGrow={1} minWidth={0} minHeight={0} display='flex' flexDirection='column'>
					<CallStage
						localParticipant={localParticipant}
						remoteParticipants={remoteParticipants}
						onStopLocalScreenShare={onToggleScreenSharing}
						handPositions={handPositions}
						reactionsByParticipant={reactionsByParticipant}
						captionsByParticipant={activeCaptions}
					/>
				</Box>
				{showChat && children && (
					<Box display='flex' flexDirection='column' flexShrink={0} width={400} h='full' overflow='hidden'>
						{children}
					</Box>
				)}
			</Box>
			<ActionStrip
				rightSlot={
					!hideChatToggle ? (
						<ButtonGroup>
							<ActionToggleChat pressed={showChat} onClick={onToggleChat} unreadCount={unreadCount} />
							{/* LK calls live exclusively in the pop-out window — no
							    in-app popout toggle, and device switching happens via
							    the toolbar chevrons. VoIP 1:1 keeps both. */}
							{!isLiveKitCall && (
								<>
									<ToggleButton
										label={t('Open_in_new_window')}
										titles={[t('Open_in_new_window'), t('Return_to_main_window')]}
										icons={['arrow-to-square-box', 'arrow-from-cross-box']}
										pressed={isPopout}
										onToggle={isPopout ? onClosePopout : onOpenPopout}
										danger={false}
									/>
									<DevicePicker secondary />
								</>
							)}
						</ButtonGroup>
					) : undefined
				}
			>
				<JoinedButtonGroup
					state={muted ? 'off' : 'on'}
					label={t('Mute')}
					icons={['mic', 'mic-off']}
					title={muted ? t('Unmute') : t('Mute')}
					onToggle={onMute}
					menu={<DevicePicker chevron />}
				/>
				{onToggleCamera && (
					<JoinedButtonGroup
						state={(localCamera?.active ?? false) ? 'on' : 'off'}
						label={t('Camera')}
						icons={['video', 'video-off']}
						title={(localCamera?.active ?? false) ? t('Stop_camera') : t('Start_camera')}
						onToggle={onToggleCamera}
						menu={<CameraPicker />}
					/>
				)}
				{!isLiveKitCall && (
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
				)}
				{/* sharing is an active TOOL state (lit Primary), not danger —
				    red is reserved for leaving the call */}
				<JoinedButtonGroup
					state={(localScreen?.active ?? false) ? 'active' : 'on'}
					label={t('Share_screen')}
					icons={['desktop-arrow-up', 'desktop-arrow-up']}
					title={(localScreen?.active ?? false) ? t('Stop_sharing_screen') : t('Share_screen')}
					onToggle={onToggleScreenSharing}
				/>
				{/* CC split group: lit Primary while captions are on; the chevron
				    holds the transcription-language menu, same pattern as the
				    device pickers. */}
				{onToggleCaptions && (
					<JoinedButtonGroup
						state={captionsEnabledLocally ? 'active' : 'on'}
						label={captionsEnabledLocally ? t('Hide_captions') : t('Show_captions')}
						icons={['quote', 'quote']}
						title={captionsEnabledLocally ? t('Hide_captions') : t('Show_captions')}
						onToggle={onToggleCaptions}
						menu={
							onChangeCallLanguage ? <CaptionsLanguageMenu currentCode={currentLanguage.code} onChange={onChangeCallLanguage} /> : undefined
						}
					/>
				)}
				{onToggleHand && (
					<ToggleButton
						label={t('Raise_hand')}
						icons={['hand-pointer', 'hand-pointer']}
						titles={[t('Raise_hand'), t('Lower_hand')]}
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
