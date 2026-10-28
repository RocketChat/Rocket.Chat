import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppsFilterSlotProps = {
	fixedWidth?: boolean;
	children: ReactNode;
};

/**
 * One dropdown of the apps filter bar, sharing the bar's width with the others or held at a fixed width on wide screens.
 */
const AppsFilterSlot = ({ fixedWidth = false, children }: AppsFilterSlotProps) => (
	<Box
		display='flex'
		flexDirection='column'
		flexGrow={1}
		maxWidth={fixedWidth ? 'x200' : undefined}
		minWidth={fixedWidth ? 'x200' : undefined}
	>
		{children}
	</Box>
);

export default AppsFilterSlot;
