import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type EngagementDashboardContentProps = {
	children: ReactNode;
};

/**
 * The content of the selected dashboard tab, set in from the page's edges.
 */
const EngagementDashboardContent = ({ children }: EngagementDashboardContentProps) => <Box margin='x24'>{children}</Box>;

export default EngagementDashboardContent;
