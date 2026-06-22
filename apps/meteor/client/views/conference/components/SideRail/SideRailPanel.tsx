import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SideRailPanelProps = {
	visible: boolean;
	overlay?: boolean;
	children: ReactNode;
};

const SideRailPanel = ({ visible, overlay = false, children }: SideRailPanelProps) => (
	<Box
		display='flex'
		flexDirection='column'
		flexShrink={0}
		width={visible ? 400 : 0}
		minWidth={visible ? 400 : 0}
		height='full'
		bg='surface-light'
		borderInlineEndWidth={visible ? 1 : 0}
		borderColor='stroke-light'
		position={overlay ? 'absolute' : 'relative'}
		zIndex={overlay ? 1 : 'auto'}
		overflow='hidden'
		style={{ transition: 'width 200ms ease, min-width 200ms ease' }}
	>
		<Box display='flex' flexDirection='column' width='100%' minWidth={400} height='full'>
			{children}
		</Box>
	</Box>
);

export default SideRailPanel;
