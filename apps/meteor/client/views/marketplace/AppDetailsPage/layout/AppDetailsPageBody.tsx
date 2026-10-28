import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsPageBodyProps = {
	children: ReactNode;
};

/**
 * The full-height column of an app's details page: its header, its tabs and the open tab below them.
 */
const AppDetailsPageBody = ({ children }: AppDetailsPageBodyProps) => (
	<Box width='full' alignSelf='center' height='full' display='flex' flexDirection='column'>
		{children}
	</Box>
);

export default AppDetailsPageBody;
