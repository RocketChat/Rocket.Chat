import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppRequestRowProps = {
	indicator?: ReactNode;
	avatar?: ReactNode;
	children: ReactNode;
};

/**
 * One request in an app's requests list: the unseen indicator and the requester's avatar, then the request's heading over its message.
 * The indicator's space is kept when it is empty, so avatars line up across seen and unseen requests.
 */
const AppRequestRow = ({ indicator, avatar, children }: AppRequestRowProps) => (
	<Box display='flex' flexDirection='row' paddingBlock='x12' paddingInlineEnd='x24' marginBlockEnd='x8'>
		<Box marginInlineEnd='x8' marginBlockStart='x4' display='flex' flexDirection='row' alignItems='flex-start' height='full'>
			<Box marginInlineEnd='x16' alignSelf='center' height='100%' width='x8'>
				{indicator}
			</Box>
			{avatar}
		</Box>
		<Box display='flex' flexDirection='column' gap='x4'>
			{children}
		</Box>
	</Box>
);

export default AppRequestRow;
