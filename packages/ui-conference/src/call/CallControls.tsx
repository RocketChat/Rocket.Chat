import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, RadioButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { ActionButton, ToggleButton } from '@rocket.chat/ui-voip';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AudioDevicePicker from './AudioDevicePicker';
import type { StageLayout } from './CallStage';
import CameraPicker from './CameraPicker';
import { useCallActions, useCallState } from './context';
import { useAudioLevel } from './hooks/useAudioLevel';

// The same "actually speaking" threshold the tiles draw, so the hand drops on the signal users see.
const SPEAKING_THRESHOLD = 0.12;

// Pauses between words shorter than this keep the auto-lower countdown running.
const SPEAKING_GAP_TOLERANCE_MS = 800;

// How long someone speaks with their hand up before it drops: they have the floor.
const AUTO_LOWER_AFTER_MS = 3000;

// Google Meet's defaults, so there is no new vocabulary to learn.
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🤔', '🙏'];

const STAGE_LAYOUTS: StageLayout[] = ['grid', 'spotlight', 'sidebar'];

const LAYOUT_ICONS: Record<StageLayout, Keys> = {
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
	display: flex;
	flex-wrap: nowrap;
	gap: 4px;
	padding: 8px;
	background-color: rgba(20, 20, 25, 0.95);
	border-radius: 10px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	z-index: 100;

	/* One row, always: where it is wider than the window it scrolls instead of wrapping or spilling. */
	max-width: calc(100vw - 24px);
	overflow-x: auto;
	overscroll-behavior-x: contain;
	-webkit-overflow-scrolling: touch;

	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
`;

const reactionButtonStyles = css`
	display: flex;
	align-items: center;
	justify-content: center;
	/* A touch target, and fixed, so a row too long to fit scrolls rather than squeezing every emoji. */
	flex: 0 0 auto;
	width: 44px;
	height: 44px;
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

const speakingWhileMutedTooltip = css`
	@keyframes swm-fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

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
`;

/**
 * The column a control can raise above the strip: the muted-while-talking notice, and the reaction picker under it.
 * Centred on the row rather than on the button that opened it, which keeps both on screen at any width.
 */
const controlNoticesStyles = css`
	position: absolute;
	bottom: calc(100% + 8px);
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;

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
	border-radius: var(--rcx-border-radius-medium, 4px);

	& button {
		border-radius: 0;
	}

	& > *:first-child button {
		opacity: 0.7;
	}
`;

/** Drops the reader's raised hand once they have been speaking for a while: they have the floor. */
const useAutoLowerHand = (handRaised: boolean, microphoneStream: MediaStream | undefined, lowerHand: () => void) => {
	const liveLevel = useAudioLevel(handRaised ? (microphoneStream ?? null) : null);
	const autoLowerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSpeakingAtRef = useRef(0);

	useEffect(() => {
		if (!handRaised) {
			if (autoLowerTimerRef.current) {
				clearTimeout(autoLowerTimerRef.current);
				autoLowerTimerRef.current = null;
			}
			lastSpeakingAtRef.current = 0;
			return;
		}
		const now = Date.now();
		if (liveLevel > SPEAKING_THRESHOLD) {
			lastSpeakingAtRef.current = now;
			if (!autoLowerTimerRef.current) {
				autoLowerTimerRef.current = setTimeout(() => {
					autoLowerTimerRef.current = null;
					lowerHand();
				}, AUTO_LOWER_AFTER_MS);
			}
			return;
		}
		if (autoLowerTimerRef.current && lastSpeakingAtRef.current > 0 && now - lastSpeakingAtRef.current > SPEAKING_GAP_TOLERANCE_MS) {
			clearTimeout(autoLowerTimerRef.current);
			autoLowerTimerRef.current = null;
			lastSpeakingAtRef.current = 0;
		}
	}, [liveLevel, handRaised, lowerHand]);
};

export type CallControlsProps = {
	layout: StageLayout;
	onLayoutChange: (layout: StageLayout) => void;
	onOpenDiagnostics: () => void;
};

/** The controls of a call running in this window: devices, sharing, hands, reactions, layout and leaving. */
const CallControls = ({ layout, onLayoutChange, onOpenDiagnostics }: CallControlsProps) => {
	const { t } = useTranslation();
	const { self, remoteParticipants } = useCallState();
	const { toggleMic, toggleCamera, toggleScreenShare, toggleHand, sendReaction, leave } = useCallActions();

	useAutoLowerHand(self.handRaised, self.microphoneStream, toggleHand);

	// A call with one other person is left *with* them, so it can name them; a group call has no single other side.
	const hangupLabel =
		remoteParticipants.length === 1 ? t('Voice_call__user__hangup', { user: remoteParticipants[0].displayName }) : t('Leave_call');

	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const reactionPickerRef = useRef<HTMLDivElement>(null);
	// The popover hangs off the controls row rather than the button, so "outside" is asked of both.
	const reactionPopoverRef = useRef<HTMLDivElement>(null);

	// Stays open while emojis are clicked, so several can be sent in a row; closes on a click anywhere else.
	useEffect(() => {
		if (!reactionPickerOpen) return undefined;
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node;
			const nodes = [reactionPickerRef.current, reactionPopoverRef.current].filter((node): node is HTMLDivElement => node !== null);
			if (nodes.length && !nodes.some((node) => node.contains(target))) {
				setReactionPickerOpen(false);
			}
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [reactionPickerOpen]);

	const layoutItems: GenericMenuItemProps[] = STAGE_LAYOUTS.map((l) => ({
		id: l,
		textValue: LAYOUT_LABELS[l],
		icon: LAYOUT_ICONS[l],
		content: (
			<Box is='span' title={LAYOUT_LABELS[l]} fontSize={14}>
				{LAYOUT_LABELS[l]}
			</Box>
		),
		addon: <RadioButton checked={layout === l} readOnly />,
		onClick: () => onLayoutChange(l),
	}));

	const moreItems: GenericMenuItemProps[] = [
		{ id: 'diagnostics', icon: 'info-circled', content: t('Connection_info'), onClick: onOpenDiagnostics },
	];

	return (
		<ButtonGroup large style={{ position: 'relative', gap: 8 }}>
			<Box className={deviceControlStyles}>
				<Box>
					<AudioDevicePicker danger={self.muted} large />
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
					<CameraPicker danger={!self.cameraOn} large />
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
			<ToggleButton
				label='Raise hand'
				icons={['hand-pointer', 'hand-pointer']}
				titles={['Raise hand', 'Lower hand']}
				pressed={self.handRaised}
				large
				onToggle={toggleHand}
			/>
			<Box className={reactionPickerWrapStyles} ref={reactionPickerRef}>
				<ToggleButton
					label='Send reaction'
					icons={['emoji', 'emoji']}
					titles={['Send reaction', 'Send reaction']}
					pressed={reactionPickerOpen}
					large
					onToggle={() => setReactionPickerOpen((p) => !p)}
				/>
			</Box>
			<GenericMenu
				title={t('More')}
				sections={[{ items: layoutItems }, { items: moreItems }]}
				placement='top-end'
				selectionMode='multiple'
				button={<ActionButton secondary label={t('More')} icon='kebab' large />}
			/>
			<ActionButton label={hangupLabel} icon='phone-off' danger large onClick={leave} />
			{(self.speakingWhileMuted || reactionPickerOpen) && (
				<Box className={controlNoticesStyles}>
					{self.speakingWhileMuted && (
						<Box className={speakingWhileMutedTooltip} onClick={toggleMic}>
							{t('You_are_muted')}
						</Box>
					)}
					{reactionPickerOpen && (
						<Box className={reactionPickerStyles} ref={reactionPopoverRef}>
							{REACTION_EMOJIS.map((emoji) => (
								<Box
									key={emoji}
									is='button'
									type='button'
									title={`Send ${emoji}`}
									className={reactionButtonStyles}
									onClick={() => sendReaction(emoji)}
								>
									{emoji}
								</Box>
							))}
						</Box>
					)}
				</Box>
			)}
		</ButtonGroup>
	);
};

export default CallControls;
