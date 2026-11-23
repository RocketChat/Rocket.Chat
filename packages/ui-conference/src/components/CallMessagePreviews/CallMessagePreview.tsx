import { css, keyframes } from '@rocket.chat/css-in-js';
import { IconButton, Palette, Text, borderRadius, useStyle } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss.js';

const enter = keyframes`
	from {
		opacity: 0;
		transform: translateY(-0.5rem);
	}
`;

const previewStylesFor = (compact: boolean) => css`
	position: relative;
	display: flex;
	align-items: ${compact ? 'center' : 'flex-start'};
	gap: ${compact ? '0.5rem' : '0.75rem'};
	padding: ${compact ? '0.5rem' : '0.75rem'};
	border-radius: ${borderRadius('large')};
	background-color: ${Palette.surface['surface-light'].toString()};
	box-shadow:
		0 2px 4px 0 ${Palette.shadow['shadow-elevation-2x'].toString()},
		0 8px 24px 0 ${Palette.shadow['shadow-elevation-2y'].toString()};
	pointer-events: auto;

	/* A touch screen keeps an element hovered after a tap, which would leave the preview looking pressed. */
	@media (hover: hover) {
		&:hover {
			background-color: ${Palette.surface['surface-hover'].toString()};
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		animation: ${enter} 200ms ease-out;
	}
`;

const previewStyles = { regular: previewStylesFor(false), compact: previewStylesFor(true) };

const openStyles = css`
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	font: inherit;
	text-align: start;
	cursor: pointer;

	/* Stretches the button over the whole preview, so pressing anywhere on it opens the message. */
	&::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: ${borderRadius('large')};
	}

	&:focus-visible {
		outline: none;
	}

	/* An outline rather than a shadow: forced colours drop shadows, and the ring with them. */
	&:focus-visible::after {
		outline: 2px solid ${Palette.stroke['stroke-highlight'].toString()};
		outline-offset: -2px;
	}
`;

const textStylesFor = (lines: number) => css`
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: ${lines};
	overflow: hidden;
	overflow-wrap: anywhere;
`;

const textStyles = { regular: textStylesFor(2), compact: textStylesFor(1) };

/* Positioned so it paints over the open button's stretched area, which would otherwise take its clicks. */
const dismissStyles = css`
	position: relative;
`;

export type CallMessagePreviewProps = {
	username: string;
	name: string;
	/** What the message says, as plain text. */
	children: string;
	/** One line of text and tighter spacing, for a window with little room over the call. */
	compact?: boolean;
	onOpen: () => void;
	/** Given the click when the dismiss button was pressed, and nothing when the preview was swiped away. */
	onDismiss: (event?: MouseEvent<HTMLElement>) => void;
};

/** One chat message previewed over the call, as an item of `CallMessagePreviews`. */
const CallMessagePreview = ({ username, name, children, compact = false, onOpen, onDismiss }: CallMessagePreviewProps) => {
	const { t } = useTranslation();
	const swipeRef = useSwipeToDismiss(onDismiss);
	const variant = compact ? 'compact' : 'regular';
	const previewClassName = useStyle(previewStyles[variant]);
	const openClassName = useStyle(openStyles);
	const textClassName = useStyle(textStyles[variant]);
	const dismissClassName = useStyle(dismissStyles);

	return (
		<li ref={swipeRef} className={previewClassName}>
			<UserAvatar username={username} size={compact ? 'x28' : 'x36'} />
			<button
				type='button'
				className={openClassName}
				aria-label={t('Chat_message_from_name', { name, message: children })}
				onClick={onOpen}
			>
				<Text is='span' fontScale='p2b' color='titles-labels' truncate>
					{name}
				</Text>
				<Text is='span' fontScale='p2' color='default' className={textClassName}>
					{children}
				</Text>
			</button>
			<IconButton
				icon='cross'
				size={compact ? 'small' : 'tiny'}
				aria-label={t('Dismiss_message_from_name', { name })}
				className={dismissClassName}
				onClick={onDismiss}
			/>
		</li>
	);
};

export default CallMessagePreview;
