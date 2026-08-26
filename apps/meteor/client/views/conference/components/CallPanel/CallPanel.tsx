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
		width={visible ? PANEL_WIDTH : 0}
		minWidth={visible ? PANEL_WIDTH : 0}
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
		style={{ transition: 'width 200ms ease, min-width 200ms ease' }}
	>
		<Box display='flex' flexDirection='column' width='100%' minWidth={PANEL_WIDTH} height='100%'>
			{children}
		</Box>
	</Contextualbar>
);

export default CallPanel;
