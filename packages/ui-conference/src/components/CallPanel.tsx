import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { CALL_TOP_BAR_MIN_HEIGHT } from './CallTopBar';
import { CONFERENCE_THEMED_CLASS } from '../lib/panelStyles';

type CallPanelProps = {
	visible: boolean;
	/** Rise over the whole window instead of taking width from the call. */
	sheet?: boolean;
	/** Which side of the call the panel docks to. Ignored as a sheet, which covers the window either way. */
	dock?: 'start' | 'end';
	children: ReactNode;
};

/** In rem, so the panel grows with the reader's font size, as the product's contextual bar does. */
const PANEL_WIDTH = '25rem';

/** Never wider than the window: `minWidth` keeps the docked panel from being squeezed by the call beside it. */
const PANEL_INLINE_SIZE = `min(${PANEL_WIDTH}, 100vw)`;

const CLOSE_MS = 200;

/**
 * A side panel for conference content: the chat, the members.
 *
 * Opening and closing is what it adds to a plain surface — the outer width animates to zero while the inner box
 * keeps its own, so the content slides out rather than reflowing as it goes. See
 * [docs/features/video-conference.md](../../../../docs/features/video-conference.md) for the docked and sheet
 * layouts.
 */
const CallPanel = ({ visible, sheet = false, dock = 'end', children }: CallPanelProps) => {
	const dockedInlineSize = visible ? PANEL_INLINE_SIZE : 0;

	/**
	 * What was in the panel, kept for as long as it takes to leave — the page stops rendering the contents the
	 * moment it closes, leaving nothing to slide out. In a ref because `children` is a new element every render.
	 */
	const leaving = useRef(children);
	if (visible) {
		leaving.current = children;
	}

	const [mounted, setMounted] = useState(visible);

	useEffect(() => {
		if (visible) {
			setMounted(true);
			return;
		}

		const timer = setTimeout(() => setMounted(false), CLOSE_MS);

		return () => clearTimeout(timer);
	}, [visible]);

	/*
	 * Two rules here are not preference:
	 *
	 * - `inset-block-start` takes the bar's own height as its floor, or on a short screen the sheet opens inside
	 *   the bar, over its controls.
	 * - `visibility` switches at the *end* of the closing animation. `overflow: hidden` hides a shut panel's
	 *   composer and close button from the eye but leaves them in the tab order and the accessibility tree;
	 *   switching it with the animation instead would hide the slide it was sliding.
	 */
	const panelStyle = sheet
		? css`
				inset-inline: 2px;
				inset-block-end: 0;
				inset-block-start: calc(${CALL_TOP_BAR_MIN_HEIGHT}px + clamp(0px, 2dvh, 1rem));

				border-start-start-radius: 0.75rem;
				border-start-end-radius: 0.75rem;

				box-shadow:
					0 -2px 4px 0 ${Palette.shadow['shadow-elevation-2x'].toString()},
					0 -8px 24px 0 ${Palette.shadow['shadow-elevation-2y'].toString()};

				padding-block-end: env(safe-area-inset-bottom, 0px);

				visibility: ${visible ? 'visible' : 'hidden'};
				transform: translateY(${visible ? '0' : '100%'});
				transition:
					transform ${CLOSE_MS}ms ease,
					visibility 0s linear ${visible ? 0 : CLOSE_MS}ms;
				will-change: transform;
			`
		: // Rounded only where it meets the call: the borderRadius prop names whole-box tokens, not corners.
			css`
				order: ${dock === 'start' ? -1 : 0};

				border-start-start-radius: ${dock === 'start' ? 0 : '0.25rem'};
				border-end-start-radius: ${dock === 'start' ? 0 : '0.25rem'};
				border-start-end-radius: ${dock === 'start' ? '0.25rem' : 0};
				border-end-end-radius: ${dock === 'start' ? '0.25rem' : 0};

				visibility: ${visible ? 'visible' : 'hidden'};
				transition:
					width ${CLOSE_MS}ms ease,
					min-width ${CLOSE_MS}ms ease,
					visibility 0s linear ${visible ? 0 : CLOSE_MS}ms;
			`;

	return (
		<Box
			is='aside'
			// An array, not a joined string: `css` returns an object Fuselage resolves itself, and joining it
			// stringifies to `[object Object]`.
			className={[CONFERENCE_THEMED_CLASS, panelStyle]}
			display='flex'
			flexDirection='column'
			flexShrink={0}
			color='default'
			backgroundColor='surface-light'
			overflow='hidden'
			height={sheet ? undefined : 'full'}
			zIndex={sheet ? 100 : undefined}
			position={sheet ? 'fixed' : 'relative'}
			width={sheet ? undefined : dockedInlineSize}
			minWidth={sheet ? undefined : dockedInlineSize}
			borderBlockWidth={sheet ? 'none' : 'default'}
			borderBlockStyle='solid'
			borderBlockColor='stroke-extra-light'
			borderInlineStartWidth={sheet || !visible || dock === 'start' ? 'none' : 'default'}
			borderInlineStartStyle='solid'
			borderInlineStartColor='stroke-extra-light'
			borderInlineEndWidth={sheet || !visible || dock === 'end' ? 'none' : 'default'}
			borderInlineEndStyle='solid'
			borderInlineEndColor='stroke-extra-light'
		>
			<Box display='flex' flexDirection='column' width='100%' minWidth={sheet ? 0 : PANEL_INLINE_SIZE} height='100%'>
				{/* `visible` too, so opening shows the contents on the frame it is asked for, not the one after. */}
				{visible || mounted ? leaving.current : null}
			</Box>
		</Box>
	);
};

export default CallPanel;
