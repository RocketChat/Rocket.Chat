import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppInstancesPanelProps = {
	children: ReactNode;
};

/**
 * The instances tab, filling the tab's width and height below the tabs.
 */
const AppInstancesPanel = ({ children }: AppInstancesPanelProps) => (
	<Box height='full' width='full' marginInline='auto' paddingBlockStart='x24'>
		{children}
	</Box>
);

export default AppInstancesPanel;
