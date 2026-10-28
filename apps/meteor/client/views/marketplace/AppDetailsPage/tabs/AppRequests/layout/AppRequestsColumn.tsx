import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppRequestsColumnProps = {
	grow?: boolean;
	children: ReactNode;
};

/**
 * The centred column that lists an app's requests, growing to push the pagination to the bottom when `grow` is set.
 */
const AppRequestsColumn = ({ grow = false, children }: AppRequestsColumnProps) => (
	<Box width='full' maxWidth='x608' marginInline='auto' paddingBlockStart='x32' flexGrow={grow ? 1 : undefined}>
		{children}
	</Box>
);

export default AppRequestsColumn;
