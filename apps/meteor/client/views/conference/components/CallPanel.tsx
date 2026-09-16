import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { CALL_TOP_BAR_MIN_HEIGHT } from './CallTopBar';
import { CONFERENCE_THEMED_CLASS } from '../panelStyles';

type CallPanelProps = {
	visible: boolean;
	/**
	 * Come up from the bottom over the whole window instead of taking width from the call — used on viewports
	 * too narrow to split, where a docked panel leaves both halves too small to use.
	 */
	sheet?: boolean;
	children: ReactNode;
};

/**
 * In rem, so the panel grows with the reader's font size instead of squeezing the same chat into a fixed box —
 * the product sizes its own contextual bar the same way. 25rem is the 400px it was drawn at.
 */
const PANEL_WIDTH = '25rem';

/**
 * Never wider than the window. `minWidth` is what makes the panel keep its width instead of being squeezed by
 * the call beside it, and on the sheet path — chosen for viewports too narrow to split — that same floor would
 * push the panel's own controls off the screen. The clamp leaves the split layout untouched, since it is only
 * used above the `md` breakpoint, which is wider than the panel.
 */
const PANEL_INLINE_SIZE = `min(${PANEL_WIDTH}, 100vw)`;

const CLOSE_MS = 200;

/**
 * A side panel for conference content (the chat, the members).
 *
 * Its own surface rather than the product's contextual bar. It started as one, for the sake of having the same
 * edges and background as a panel beside a room — but almost nothing of that survived: the bar's background, its
 * width, its borders, its radius, its position and its overflow were all overridden, and the sheet had to hand
 * back the four props it sets on its own Box (`insetBlockStart`, `insetInlineEnd`, `height`, `zIndex`) because a
 * Box prop beats a class whichever order the stylesheets land in, and the sheet's own insets were losing to them
 * in silence. What was left of the bar was a marker attribute with no styles behind it.
 *
 * Still `Box` and not `@rocket.chat/styled`: what this needs from the design system is colours and border widths
 * *by name*, and a styled template can only reach them by writing out the custom properties — which is the copy
 * that goes stale. The parts that are genuinely CSS, and depend on the props, are the class below.
 *
 * What it adds to a plain surface is opening and closing: the outer width animates to zero while the inner box
 * keeps its own, so the content slides out rather than reflowing as it goes. It is a sibling of the call area
 * *above* the call bar, never a child of it, so that animation never reflows the bar.
 */
const CallPanel = ({ visible, sheet = false, children }: CallPanelProps) => {
	// The docked panel's width is what animates; a sheet's is the window's, and it animates its position instead.
	const dockedInlineSize = visible ? PANEL_INLINE_SIZE : 0;

	/*
	 * What was in the panel, kept for as long as it takes to leave.
	 *
	 * The page renders the open panel's contents and nothing else, so the moment one closes there is nothing left
	 * inside to slide out — the animation played over an empty box. The contents are held here instead and let go
	 * when the slide ends, rather than kept forever: a chat left mounted behind a closed panel goes on listening.
	 *
	 * In a ref because `children` is a new element every render, so state would re-enter itself.
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
	 * Written here rather than at module scope because what it says depends on the props. A static class plus an
	 * inline style object for the moving parts was two mechanisms for one appearance, and the object was rebuilt
	 * every render anyway — `css` generates a class per distinct declaration, which is the same cost and one place.
	 *
	 * A phone-sized window has no room to split: a docked panel took half of it, which left the call a sliver and
	 * the chat a message list two lines tall above its own composer — neither of them usable. So there the panel
	 * stops being a column beside the call and becomes a sheet that rises over the whole window, the way a phone
	 * shows a screen that owns your attention until you dismiss it.
	 *
	 * What each rule is for, since a css-in-js template is parsed on every call and comments inside it are parsed
	 * with it:
	 *
	 * - `inset-inline: 2px` leaves a hair of the call showing down both sides, so the sheet reads as something
	 *   laid over the call rather than as the window's new contents. In px on purpose — a hairline that grew with
	 *   the font size would stop being one.
	 * - `inset-block-start` clears the top bar, and then leaves a little of the call showing above the sheet for
	 *   the same reason. The bar's own height is the floor: a proportional gap alone is shorter than the bar on a
	 *   short screen, and the sheet began inside it, over its controls. What stays proportional is the air below
	 *   the bar — capped, so a tall window doesn't open a chasm.
	 * - The shadow is the product's own elevation-2 pair, scaled up and aimed upwards: a sheet is a much larger
	 *   surface than the dropdown that shadow was drawn for, and what it has to lift away from is above it. It
	 *   reads when there is something bright behind — a camera with a picture in it — and costs nothing over a
	 *   black tile.
	 * - `padding-block-end` keeps the home indicator off the chat's composer.
	 * - `visibility` is switched at the end of the closing animation rather than with it, on both paths:
	 *   `overflow: hidden` hides a shut panel's composer and close button from the eye but leaves them in the tab
	 *   order and in the accessibility tree, and `visibility` takes them out of both. Immediate on the way open,
	 *   so the content is there as it arrives — and delayed on the way out, or the sheet would go invisible the
	 *   moment it was asked to close and never show the slide it was sliding.
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
		: css`
				/* Rounded only where it meets the call: the borderRadius prop names whole-box tokens, not corners. */
				border-start-start-radius: 0.25rem;
				border-end-start-radius: 0.25rem;

				visibility: ${visible ? 'visible' : 'hidden'};
				transition:
					width ${CLOSE_MS}ms ease,
					min-width ${CLOSE_MS}ms ease,
					visibility 0s linear ${visible ? 0 : CLOSE_MS}ms;
			`;

	return (
		<Box
			is='aside'
			// What the panel holds is room UI, so it is read in the reader's own theme rather than in the dark the
			// window around it is pinned to.
			// An array rather than a joined string: `css` returns an object Fuselage resolves itself, and joining it
			// stringifies it to `[object Object]` — which is a class name that exists nowhere, so the sheet's own
			// rules silently never applied.
			className={[CONFERENCE_THEMED_CLASS, panelStyle]}
			display='flex'
			flexDirection='column'
			flexShrink={0}
			color='default'
			// Chrome beside a call rather than a room, and the chat inside it paints its own room background anyway.
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
			borderInlineStartWidth={sheet || !visible ? 'none' : 'default'}
			borderInlineStartStyle='solid'
			borderInlineStartColor='stroke-extra-light'
		>
			<Box display='flex' flexDirection='column' width='100%' minWidth={sheet ? 0 : PANEL_INLINE_SIZE} height='100%'>
				{/* `visible` as well as `mounted`, so opening shows the contents on the frame it is asked for rather
				    than on the one after the effect runs. */}
				{visible || mounted ? leaving.current : null}
			</Box>
		</Box>
	);
};

export default CallPanel;
