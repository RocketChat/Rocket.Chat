import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppRequestRowProps = {
	leading: ReactNode;
	children: ReactNode;
};

/**
 * One request in an app's requests list: the requester's avatar, then the request's heading over its message.
 */
const AppRequestRow = ({ leading, children }: AppRequestRowProps) => (
	<Box display='flex' flexDirection='row' paddingBlock='x12' paddingInlineEnd='x24' marginBlockEnd='x8'>
		<Box marginInlineEnd='x8' marginBlockStart='x4' display='flex' flexDirection='row' alignItems='flex-start' height='full'>
			{leading}
		</Box>
		<Box display='flex' flexDirection='column' gap='x4'>
			{children}
		</Box>
	</Box>
);

export default AppRequestRow;
