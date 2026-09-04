import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { Contextualbar } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

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

const PANEL_WIDTH = 400;

/**
 * Never wider than the window. `minWidth` is what makes the panel keep its width instead of being squeezed by
 * the call beside it, and on the sheet path — chosen for viewports too narrow to split — that same floor would
 * push the panel's own controls off the screen. The clamp leaves the split layout untouched, since it is only
 * used above the `md` breakpoint, which is wider than the panel.
 */
const PANEL_INLINE_SIZE = `min(${PANEL_WIDTH}px, 100vw)`;

const CLOSE_MS = 200;

/**
 * A phone-sized window has no room to split: a docked panel took half of it, which left the call a sliver and
 * the chat a message list two lines tall above its own composer — neither of them usable. So there the panel
 * stops being a column beside the call and becomes a sheet that rises over the whole window, the way a phone
 * shows a screen that owns your attention until you dismiss it.
 *
 * `fixed` rather than absolute, because the sheet covers the call's bars too: the panel is a sibling of the
 * call area, so anything positioned within that row would stop at the top bar and leave the controls beneath it
 * reachable behind the sheet. Its own header carries the close button, which is the way back out.
 *
 * Rounded at the top and inset by nothing else, so the dark call shows at the corners — enough to read as
 * something laid over the call rather than a new page — and padded for the home indicator, which otherwise sits
 * on top of the chat's composer.
 */
const sheetStyle = css`
	/* A hair of the call left showing down both sides, for the same reason as the gap above: it reads as
	   something laid over the call rather than as the window's new contents. */
	inset-inline: 2px;
	inset-block-end: 0;

	/* A sheet doesn't touch the top: leaving the call visible above it is what says this is laid *over* the call
	   rather than being a page of its own. Proportional, so a landscape phone doesn't spend a tenth of its height
	   on the gap, and capped, so a tall window doesn't open a chasm. */
	inset-block-start: clamp(16px, 6dvh, 48px);

	border-start-start-radius: 12px;
	border-start-end-radius: 12px;

	/* The product's own elevation-2 pair, scaled up and aimed upwards: a sheet is a much larger surface than the
	   dropdown that shadow was drawn for, and what it has to lift away from is above it. It reads when there is
	   something bright behind — a camera with a picture in it — and costs nothing over a black tile. */
	box-shadow:
		0 -2px 4px 0 var(--rcx-color-shadow-elevation-2x, rgba(47, 52, 61, 0.08)),
		0 -8px 24px 0 var(--rcx-color-shadow-elevation-2y, rgba(47, 52, 61, 0.12));

	padding-block-end: env(safe-area-inset-bottom, 0px);
	transition: transform ${CLOSE_MS}ms ease;
	will-change: transform;
`;

/**
 * A side panel for conference content (the chat, the members).
 *
 * It is the product's own contextual bar, so a panel beside the call has the same edges, background and
 * elevation as one beside a room. What it adds is opening and closing: the outer width animates to zero while
 * the inner box keeps its own, so the content slides out rather than reflowing as it goes.
 *
 * It is a sibling of the call area *above* the call bar, never a child of it, so that animation never reflows
 * the bar.
 */
const CallPanel = ({ visible, sheet = false, children }: CallPanelProps) => {
	// The docked panel's width is what animates; a sheet's is the window's, and it animates its position instead.
	const dockedInlineSize = visible ? PANEL_INLINE_SIZE : 0;

	// `Contextualbar` sets `insetBlockStart`, `insetInlineEnd`, `height` and `zIndex` on its own Box, and a Box
	// prop beats a class whichever order the two stylesheets land in — the sheet's `top` and derived height lost
	// to `top: 0` and `height: 100%` in silence, leaving it flush with the top of the window, and its inline end
	// would lose the same way. So the sheet hands all four back as props and sets its own insets in the class;
	// the docked panel passes nothing and keeps every default it had.
	const sheetOverrides = sheet ? { insetBlockStart: undefined, insetInlineEnd: undefined, height: undefined, zIndex: 100 } : {};

	return (
		<Contextualbar
			{...sheetOverrides}
			// What the panel holds is room UI, so it is read in the reader's own theme rather than in the dark the
			// window around it is pinned to.
			// An array rather than a joined string: `css` returns an object Fuselage resolves itself, and joining it
			// stringifies it to `[object Object]` — which is a class name that exists nowhere, so the sheet's own
			// rules silently never applied.
			className={[CONFERENCE_THEMED_CLASS, ...(sheet ? [sheetStyle] : [])]}
			width={sheet ? undefined : dockedInlineSize}
			minWidth={sheet ? undefined : dockedInlineSize}
			borderBlockWidth={sheet ? 0 : 'default'}
			borderBlockStyle='solid'
			borderBlockColor='stroke-extra-light'
			borderInlineStartWidth={sheet || !visible ? 0 : 'default'}
			borderRadius={sheet ? undefined : '4px 0px 0px 4px'}
			position={sheet ? 'fixed' : 'relative'}
			// The one thing not taken from the contextual bar's defaults, which is `surface-room`. Beside a call the
			// panel is chrome rather than a room, and the chat inside it paints its own room background anyway.
			backgroundColor='surface-light'
			overflow='hidden'
			style={{
				// A panel animated shut is still in the DOM: `overflow: hidden` hides its chat input and its close
				// button from the eye but leaves them in the tab order and in the accessibility tree, so a keyboard or
				// screen-reader user can reach a panel that is shut. `visibility` takes them out of both — switched at
				// the end of the closing animation so the content doesn't vanish before it has slid away, and
				// immediately on the way open so it is there as it arrives.
				visibility: visible ? 'visible' : 'hidden',
				...(sheet
					? { transform: visible ? 'translateY(0)' : 'translateY(100%)' }
					: {
							transition: `width ${CLOSE_MS}ms ease, min-width ${CLOSE_MS}ms ease, visibility 0s linear ${visible ? 0 : CLOSE_MS}ms`,
						}),
			}}
		>
			<Box display='flex' flexDirection='column' width='100%' minWidth={sheet ? 0 : PANEL_INLINE_SIZE} height='100%'>
				{children}
			</Box>
		</Contextualbar>
	);
};

export default CallPanel;
