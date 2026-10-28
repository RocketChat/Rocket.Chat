import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type DiscussionsListViewportProps = {
	children: ReactNode;
};

/**
 * The box the paginated discussions list measures and scrolls inside, allowed to shrink below its content's height.
 */
const DiscussionsListViewport = ({ children }: DiscussionsListViewportProps) => (
	<Box height='full' width='full' style={{ minHeight: 0 }}>
		{children}
	</Box>
);

export default DiscussionsListViewport;
