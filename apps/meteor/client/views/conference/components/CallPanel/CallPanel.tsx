import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallPanelProps = {
	visible: boolean;
	/** Float over the call instead of taking width from it — used on viewports too narrow to split. */
	overlay?: boolean;
	children: ReactNode;
};

const PANEL_WIDTH = 400;

/**
 * A side panel for conference content (today: the persistent chat).
 *
 * It is a sibling of the call area *above* the call bar, never a child of it, so opening and closing the
 * panel animates its own width without ever reflowing the bar. The inner box keeps its full width while
 * the outer one collapses, so the content slides rather than reflowing as it animates.
 */
const CallPanel = ({ visible, overlay = false, children }: CallPanelProps) => (
	<Box
		display='flex'
		flexDirection='column'
		flexShrink={0}
		width={visible ? PANEL_WIDTH : 0}
		minWidth={visible ? PANEL_WIDTH : 0}
		height='100%'
		backgroundColor='surface-light'
		borderInlineStartWidth={visible ? 'default' : 0}
		borderInlineStartStyle='solid'
		borderInlineStartColor='stroke-extra-light'
		position={overlay ? 'absolute' : 'relative'}
		insetBlockStart={overlay ? 0 : undefined}
		insetInlineEnd={overlay ? 0 : undefined}
		zIndex={overlay ? 1 : undefined}
		overflow='hidden'
		style={{ transition: 'width 200ms ease, min-width 200ms ease' }}
	>
		<Box display='flex' flexDirection='column' width='100%' minWidth={PANEL_WIDTH} height='100%'>
			{children}
		</Box>
	</Box>
);

export default CallPanel;
