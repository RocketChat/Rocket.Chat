import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import AppRequestsColumn from './AppRequestsColumn';

type AppRequestsPanelProps = {
	footer?: ReactNode;
	children: ReactNode;
};

/**
 * The requests tab: the list of requests filling the tab's height, with the pagination below it.
 */
const AppRequestsPanel = ({ footer, children }: AppRequestsPanelProps) => (
	<Box height='full' display='flex' flexDirection='column'>
		<AppRequestsColumn grow>{children}</AppRequestsColumn>
		{footer}
	</Box>
);

export default AppRequestsPanel;
