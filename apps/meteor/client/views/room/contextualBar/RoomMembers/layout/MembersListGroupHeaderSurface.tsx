import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MembersListGroupHeaderSurfaceProps = {
	/** The header opens the list, so nothing above needs clearing. */
	first?: boolean;
	children: ReactNode;
};

/**
 * The opaque band behind a members group's header, so the rows scrolling under it stay hidden.
 */
const MembersListGroupHeaderSurface = ({ first, children }: MembersListGroupHeaderSurfaceProps) => (
	<Box backgroundColor='room' paddingBlockStart={first ? undefined : 'x8'}>
		{children}
	</Box>
);

export default MembersListGroupHeaderSurface;
