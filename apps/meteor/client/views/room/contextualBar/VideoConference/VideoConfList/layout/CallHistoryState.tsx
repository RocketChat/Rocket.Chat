import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CallHistoryStateProps = {
	children: ReactNode;
};

/**
 * The error or the empty state of the call history, centred in the panel's height.
 */
const CallHistoryState = ({ children }: CallHistoryStateProps) => (
	<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
		{children}
	</Box>
);

export default CallHistoryState;
