import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CallHistoryListAreaProps = {
	children: ReactNode;
};

/**
 * The area the call history list fills, clipped so the list scrolls inside it.
 */
const CallHistoryListArea = ({ children }: CallHistoryListAreaProps) => (
	<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
		{children}
	</Box>
);

export default CallHistoryListArea;
