import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsTabPanelProps = {
	offset?: boolean;
	children: ReactNode;
};

/**
 * The centred, reading-width column that holds an app details tab's content; `offset` sets it further below the tabs.
 */
const AppDetailsTabPanel = ({ offset = false, children }: AppDetailsTabPanelProps) => (
	<Box maxWidth='x640' width='full' marginInline='auto' marginBlockStart={offset ? 'x32' : undefined}>
		{children}
	</Box>
);

export default AppDetailsTabPanel;
