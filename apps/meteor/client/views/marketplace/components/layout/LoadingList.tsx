import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type LoadingListProps = {
	children: ReactNode;
};

/**
 * Stacks the placeholders shown while a list of rows loads.
 */
const LoadingList = ({ children }: LoadingListProps) => (
	<Box display='flex' flexDirection='column' gap='x8' padding='x4'>
		{children}
	</Box>
);

export default LoadingList;
