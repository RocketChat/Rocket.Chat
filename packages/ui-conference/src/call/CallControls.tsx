import { css } from '@rocket.chat/css-in-js';
import { Box, ButtonGroup, Palette, RadioButton, borderRadius } from '@rocket.chat/fuselage';
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
import { useAutoLowerHand } from './hooks/useAutoLowerHand';

// Google Meet's defaults, so there is no new vocabulary to learn.
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🤔', '🙏'];

const STAGE_LAYOUTS: StageLayout[] = ['grid', 'spotlight', 'sidebar'];

const LAYOUT_ICONS: Record<StageLayout, Keys> = {
	grid: 'squares',
	spotlight: 'user',
	sidebar: 'stack',
};

const LAYOUT_LABELS: Record<StageLayout, string> = {
	grid: 'Call_layout_grid',
	spotlight: 'Call_layout_spotlight',
	sidebar: 'Call_layout_sidebar',
};

const reactionPickerWrapStyles = css`
	position: relative;
`;

const reactionPickerStyles = css`
	display: flex;
	flex-wrap: nowrap;
	gap: 0.25rem;
	padding: 0.5rem;
	background-color: ${Palette.surface['surface-light'].toString()};
	border-radius: ${borderRadius('large')};
	box-shadow: 0 0.5rem 1.5rem ${Palette.shadow['shadow-elevation-2y'].toString()};
	z-index: 100;

	/* One row, always: where it is wider than the window it scrolls instead of wrapping or spilling. */
	max-width: calc(100vw - 1.5rem);
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
	width: 2.75rem;
	height: 2.75rem;
	border-radius: ${borderRadius('large')};
	border: none;
	background: transparent;
	color: ${Palette.text['font-pure-white'].toString()};
	font-size: 1.5rem;
	line-height: 1;
	cursor: pointer;
	transition: background-color 80ms ease;

	&:hover {
		background-color: ${Palette.surface['surface-neutral'].toString()};
	}
`;

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

/**
 * The column a control can raise above the strip: the muted-while-talking notice, and the reaction picker under it.
 * Centred on the row rather than on the button that opened it, which keeps both on screen at any width.
 */
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
		textValue: t(LAYOUT_LABELS[l]),
		icon: LAYOUT_ICONS[l],
		content: (
			<Box is='span' title={t(LAYOUT_LABELS[l])} fontScale='p2'>
				{t(LAYOUT_LABELS[l])}
			</Box>
		),
		addon: <RadioButton checked={layout === l} readOnly />,
		onClick: () => onLayoutChange(l),
	}));

	const moreItems: GenericMenuItemProps[] = [
		{ id: 'diagnostics', icon: 'info-circled', content: t('Connection_info'), onClick: onOpenDiagnostics },
	];

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
			<ToggleButton
				label={t('Raise_hand')}
				icons={['hand-pointer', 'hand-pointer']}
				titles={[t('Raise_hand'), t('Lower_hand')]}
				pressed={self.handRaised}
				large
				onToggle={toggleHand}
			/>
			<Box className={reactionPickerWrapStyles} ref={reactionPickerRef}>
				<ToggleButton
					label={t('Send_reaction')}
					icons={['emoji', 'emoji']}
					titles={[t('Send_reaction'), t('Send_reaction')]}
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
						<Box className={speakingWhileMutedTooltip} fontScale='c1' onClick={toggleMic}>
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
									title={t('Send_reaction__emoji__', { emoji })}
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
