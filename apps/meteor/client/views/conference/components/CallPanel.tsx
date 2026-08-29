import { Box } from '@rocket.chat/fuselage';
import { Contextualbar } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

type CallPanelProps = {
	visible: boolean;
	/** Float over the call instead of taking width from it — used on viewports too narrow to split. */
	overlay?: boolean;
	children: ReactNode;
};

const PANEL_WIDTH = 400;

/**
 * Never wider than the window. `minWidth` is what makes the panel keep its width instead of being squeezed by
 * the call beside it, and on the overlay path — chosen for viewports too narrow to split — that same floor
 * would push the panel's own controls off the screen. The clamp leaves the split layout untouched, since it is
 * only used above the `md` breakpoint, which is wider than the panel.
 */
const PANEL_INLINE_SIZE = `min(${PANEL_WIDTH}px, 100vw)`;

const CLOSE_MS = 200;

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
const CallPanel = ({ visible, overlay = false, children }: CallPanelProps) => (
	<Contextualbar
		width={visible ? PANEL_INLINE_SIZE : 0}
		minWidth={visible ? PANEL_INLINE_SIZE : 0}
		borderBlockWidth='default'
		borderBlockStyle='solid'
		borderBlockColor='stroke-extra-light'
		borderInlineStartWidth={visible ? 'default' : 0}
		borderRadius='4px 0px 0px 4px'
		position={overlay ? 'absolute' : 'relative'}
		// The one thing not taken from the contextual bar's defaults, which is `surface-room`. Beside a call the
		// panel is chrome rather than a room, and the chat inside it paints its own room background anyway.
		backgroundColor='surface-light'
		overflow='hidden'
		style={{
			// A panel animated to zero width is still in the DOM: `overflow: hidden` hides its chat input and its
			// close button from the eye but leaves them in the tab order and in the accessibility tree, so a
			// keyboard or screen-reader user can reach a panel that is shut. `visibility` takes them out of both —
			// switched at the end of the closing animation so the content doesn't vanish before it has slid away,
			// and immediately on the way open so it is there as it arrives.
			visibility: visible ? 'visible' : 'hidden',
			transition: `width ${CLOSE_MS}ms ease, min-width ${CLOSE_MS}ms ease, visibility 0s linear ${visible ? 0 : CLOSE_MS}ms`,
		}}
	>
		<Box display='flex' flexDirection='column' width='100%' minWidth={PANEL_INLINE_SIZE} height='100%'>
			{children}
		</Box>
	</Contextualbar>
);

export default CallPanel;
