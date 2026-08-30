import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, RadioButton } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import CallReactions, { type CallReaction } from './CallReactions';
import CallStage, { type StageLayout } from './CallStage';
import { ToggleButton, Timer, DevicePicker, CameraPicker, ActionButton, ActionStrip, ActionToggleChat } from '../../components';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import type { RemoteParticipantInfo } from '../../context/MediaCallViewContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRegisterView from '../../context/useRegisterView';
import { useAudioLevel } from '../../providers/useAudioLevel';
import PopoutDockPrompt from '../PopoutDockPrompt';

// Speaking threshold used to auto-lower a raised hand. Mirrors the visual
// threshold in CallTile so the auto-lower triggers on the same "actually
// speaking" signal users see.
const SPEAKING_THRESHOLD = 0.12;

// Reactions shown in the picker — matches Google Meet's defaults so users
// don't need to learn a new vocabulary.
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🤔', '🙏'];

const STAGE_LAYOUTS: StageLayout[] = ['grid', 'spotlight', 'sidebar'];

const LAYOUT_ICONS: Record<StageLayout, string> = {
	grid: 'squares',
	spotlight: 'user',
	sidebar: 'stack',
};

const LAYOUT_LABELS: Record<StageLayout, string> = {
	grid: 'Grid',
	spotlight: 'Spotlight',
	sidebar: 'Sidebar',
};

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
	z-index: 100;
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
	min-width: 0;
	color: rgba(255, 255, 255, 0.85);
	font-variant-numeric: tabular-nums;
`;

// A device toggle and its selector, fused into one control: a single rounded
// outline with a hairline between the halves, so they read as one thing that
// does two things rather than as two buttons that happen to be adjacent.
//
// The selector sits first, on the inline start, where it is out of the way of
// the toggle the user actually reaches for — and its chevron points *up*,
// toward where its menu opens from a bottom bar.
const speakingWhileMutedTooltip = css`
	@keyframes swm-fade-in {
		from {
			opacity: 0;
			transform: translate(-50%, 4px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	position: absolute;
	bottom: calc(100% + 8px);
	left: 50%;
	transform: translateX(-50%);
	padding: 6px 12px;
	border-radius: 4px;
	background: rgba(245, 69, 69, 0.95);
	color: #fff;
	font-size: 12px;
	font-weight: 500;
	line-height: 1.3;
	white-space: nowrap;
	pointer-events: auto;
	cursor: pointer;
	animation: swm-fade-in 200ms ease-out;
	z-index: 10;

	&::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: rgba(245, 69, 69, 0.95);
	}
`;

const deviceControlStyles = css`
	display: inline-flex;
	align-items: stretch;
	overflow: hidden;
	border-radius: var(--rcx-border-radius-medium, 4px);

	& button {
		border-radius: 0;
	}

	/* The selector takes its toggle's colour, a shade down, so it reads as the quieter half of one control
	   rather than as a second button that happens to be the same colour. */
	& > *:first-child button {
		opacity: 0.7;
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
	/** When true, suppresses the chat-toggle button (used where the surrounding surface owns the chat toggle). */
	hideChatToggle?: boolean;
	/** Unread message count shown as a badge on the chat toggle when the chat panel is hidden. */
	unreadCount?: number;
	/** Badge variant for the unread count (danger for mentions, primary for threads, etc.). */
	unreadVariant?: 'primary' | 'warning' | 'danger' | 'secondary';
	/**
	 * Where to put the call's controls, when the surface hosting the call already has a bar of its own. The
	 * conference window does: it has a bottom bar carrying its members and chat toggles, and the call's mic,
	 * camera and hang-up belong beside them rather than in a second strip stacked above.
	 *
	 * The controls are the same ones either way — they are moved, not rebuilt, so the two placements cannot
	 * drift apart.
	 */
	actionsContainer?: HTMLElement | null;
	/**
	 * Where to put the call's header, when the surface hosting the call has a bar of its own for it. The
	 * conference window does, spanning above its side panels — inside the call area the header stopped at the
	 * panel's edge and moved whenever a panel opened.
	 *
	 * Same arrangement as `actionsContainer`: the header is moved, not rebuilt.
	 */
	headerContainer?: HTMLElement | null;
	callName?: string;
	extraMenuItems?: GenericMenuItemProps[];
};

const MediaCallRoomSection = ({
	showChat,
	onToggleChat,
	user,
	hideChatToggle,
	actionsContainer,
	headerContainer,
	callName,
	extraMenuItems,
	unreadCount = 0,
	unreadVariant = 'secondary',
}: MediaCallRoomSectionProps) => {
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
		streams: { localScreen, localCamera, localMicrophone, remoteScreen, remoteCamera, remoteMicrophone },
		sendResolution,
		speakingWhileMuted,
		remoteParticipants: remoteParticipantsRaw,
	} = useMediaCallView();
	const { currentViews } = useMediaCallInstance();

	const isPopout = currentViews.has('popout');

	useRegisterView('room');

	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState, startedAt } = sessionState;

	/**
	 * Who else is in the call, however this call describes them.
	 *
	 * A group call is a list of participants and says so. A 1:1 call has only ever had the one other side, and
	 * describes it as `peerInfo` with its media under the `remote*` streams — so it is turned into a list of one
	 * here, and the stage above stays a stage of tiles rather than growing a second way to lay a call out.
	 *
	 * An external number is not shown as a tile: it has no name, no avatar and no video, and the call's own header
	 * is what names it.
	 */
	const remoteParticipants = useMemo((): RemoteParticipantInfo[] => {
		if (remoteParticipantsRaw) {
			return remoteParticipantsRaw;
		}

		if (!peerInfo || 'number' in peerInfo) {
			return [];
		}

		return [
			{
				id: peerInfo.userId,
				displayName: peerInfo.displayName,
				avatarUrl: peerInfo.avatarUrl,
				muted: remoteMuted,
				held: remoteHeld,
				// Gated on `active` for the same reason the local tile is: a stream that has stopped producing frames
				// would render as a black rectangle where the avatar belongs.
				cameraStream: remoteCamera?.active ? remoteCamera.stream : undefined,
				screenStream: remoteScreen?.active ? remoteScreen.stream : undefined,
				audioStream: remoteMicrophone?.stream,
			},
		];
	}, [remoteParticipantsRaw, peerInfo, remoteMuted, remoteHeld, remoteCamera, remoteScreen, remoteMicrophone]);
	const isOneOnOne = remoteParticipants.length === 1;
	// A one-to-one call is left *with* someone, so it can name them. A group call has no single other side —
	// "End call with Call" is what naming one anyway produced — so it just says what the button does.
	const hangupLabel = isOneOnOne ? t('Voice_call__user__hangup', { user: remoteParticipants[0].displayName }) : t('Leave_call');
	// LK group calls don't support Hold (no SIP-style hold concept) and don't
	// support Forward (no caller/callee transfer model). onToggleHand is only
	// wired up by LiveKitMediaCallProvider, so its presence is a reliable
	// "this is an LK call" signal without threading another prop through.
	const isLiveKitCall = Boolean(onToggleHand);
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const reactionPickerRef = useRef<HTMLDivElement>(null);

	const [stageLayout, setStageLayout] = useLocalStorage<StageLayout>('videoconf-stage-layout', 'grid');

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

	// Same click-outside dismissal for the language picker.
	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	// Held steady across renders, because what is derived from it below is: rebuilding this object every render
	// rebuilt those too, for a call whose participants had not changed.
	const localParticipant = useMemo(
		() => ({
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
			// Said on the reader's own tile only: it is a fact about what *they* are sending, and the same badge on a
			// remote tile would be a claim about someone else's encoder that this client cannot make.
			sendHeight: sendResolution?.height,
		}),
		[user.id, user.displayName, user.avatarUrl, muted, held, localCamera, localScreen, localMicrophone, sendResolution?.height],
	);

	// Map participant id → 1-based queue position for the raise-hand badge.
	const handPositions = useMemo(() => {
		const out: Record<string, number> = {};
		(raisedHands ?? []).forEach((h, i) => {
			out[h.id] = i + 1;
		});
		return out;
	}, [raisedHands]);

	// One list for the whole call rather than a list per tile, because a reaction is no longer shown in the
	// sender's tile — see `CallReactions` for why. The name is looked up from everyone in the call, not from
	// whoever happens to be on screen, so a sender without a tile still arrives named. The provider's auto-expiry
	// keeps the list bounded.
	const reactions = useMemo((): CallReaction[] => {
		const names = new Map([localParticipant, ...remoteParticipants].map(({ id, displayName }) => [id, displayName]));

		return (activeReactions ?? []).map(({ id, emoji, participantId }) => ({ id, emoji, name: names.get(participantId) }));
	}, [activeReactions, localParticipant, remoteParticipants]);

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

	// How long the call has been running. The surface hosting this header owns whatever sits beside it.
	const callHeader = (
		<Box className={callHeaderTimerStyles}>
			<Timer startAt={startedAt} />
			{callName && (
				<>
					<Box is='span' color='default' opacity={0.5} marginInline={8}>
						|
					</Box>
					<Box is='span' withTruncatedText>
						{callName}
					</Box>
				</>
			)}
		</Box>
	);

	const callControls = (
		<>
			<Box className={deviceControlStyles}>
				<Box>
					<DevicePicker chevron danger={muted} />
				</Box>
				<Box position='relative'>
					<ToggleButton
						label={t('Mute')}
						icons={['mic', 'mic-off']}
						titles={speakingWhileMuted ? [t('You_are_muted'), t('You_are_muted')] : [t('Mute'), t('Unmute')]}
						pressed={muted}
						dangerWhenPressed
						onToggle={onMute}
					/>
					{speakingWhileMuted && (
						<Box className={speakingWhileMutedTooltip} onClick={onMute}>
							{t('You_are_muted')}
						</Box>
					)}
				</Box>
			</Box>
			{onToggleCamera && (
				<Box className={deviceControlStyles}>
					<Box>
						<CameraPicker danger={!(localCamera?.active ?? false)} />
					</Box>
					<Box>
						<ToggleButton
							label={t('Camera')}
							icons={['video', 'video-off']}
							titles={[t('Stop_camera'), t('Start_camera')]}
							pressed={!(localCamera?.active ?? false)}
							dangerWhenPressed
							onToggle={onToggleCamera}
						/>
					</Box>
				</Box>
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
			{(() => {
				const layoutItems: GenericMenuItemProps[] = isLiveKitCall
					? STAGE_LAYOUTS.map((l) => ({
							id: l,
							textValue: LAYOUT_LABELS[l],
							icon: LAYOUT_ICONS[l] as any,
							content: (
								<Box is='span' title={LAYOUT_LABELS[l]} fontSize={14}>
									{LAYOUT_LABELS[l]}
								</Box>
							),
							addon: <RadioButton checked={stageLayout === l} readOnly />,
							onClick: () => setStageLayout(l),
						}))
					: [];
				const sections: { title?: string; items: GenericMenuItemProps[] }[] = [];
				if (layoutItems.length > 0) sections.push({ items: layoutItems });
				if (extraMenuItems && extraMenuItems.length > 0) sections.push({ items: extraMenuItems });
				if (sections.length === 0) return null;
				return (
					<GenericMenu
						title={t('More')}
						sections={sections}
						placement='top-end'
						selectionMode='multiple'
						button={<ActionButton secondary label={t('More')} icon='kebab' />}
					/>
				);
			})()}
			<ActionButton label={hangupLabel} icon='phone-off' danger onClick={onEndCall} />
		</>
	);

	if (isPopout) {
		return (
			<Box
				is='section'
				aria-label={t('Voice_call')}
				width='full'
				height='full'
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
			is='section'
			aria-label={t('Voice_call')}
			width='full'
			height='full'
			backgroundColor='transparent'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			minHeight={0}
		>
			{/* The window may own a bar for this — when it does, the header goes up there, spanning above the side
			    panels rather than stopping at the call area's edge. */}
			{headerContainer ? createPortal(callHeader, headerContainer) : <Box className={callHeaderStyles}>{callHeader}</Box>}
			{/* Positioned so the reactions rising over the call have something to be positioned against. */}
			<Box position='relative' display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
				<CallStage
					localParticipant={localParticipant}
					remoteParticipants={remoteParticipants}
					onStopLocalScreenShare={onToggleScreenSharing}
					handPositions={handPositions}
					layout={stageLayout}
				/>
				<CallReactions reactions={reactions} />
			</Box>
			{/* The same controls either way: a surface with a bar of its own is handed them to place, and
			    otherwise they sit in the call's own strip below the stage. */}
			{actionsContainer ? (
				createPortal(
					<ButtonGroup large style={{ gap: 8 }}>
						{callControls}
					</ButtonGroup>,
					actionsContainer,
				)
			) : (
				<ActionStrip
					rightSlot={
						!hideChatToggle ? (
							<ButtonGroup>
								<ActionToggleChat pressed={showChat} onClick={onToggleChat} badgeCount={unreadCount} badgeVariant={unreadVariant} />
								<ToggleButton
									label={t('Open_in_new_window')}
									titles={[t('Open_in_new_window'), t('Return_to_main_window')]}
									icons={['arrow-to-square-box', 'arrow-from-cross-box']}
									pressed={isPopout}
									onToggle={isPopout ? onClosePopout : onOpenPopout}
									danger={false}
								/>
								<DevicePicker secondary />
							</ButtonGroup>
						) : undefined
					}
				>
					{callControls}
				</ActionStrip>
			)}
		</Box>
	);
};

export default memo(MediaCallRoomSection);
