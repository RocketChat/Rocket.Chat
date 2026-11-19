import { Card, CardTitle, CardBody, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import EngagementDashboardCardErrorBoundary from './EngagementDashboardCardErrorBoundary';

export type EngagementDashboardCardProps = {
	children?: ReactNode;
	title?: string;
};

/**
 * The card a dashboard section sits in, which contains the section's failure instead of letting it take the tab down.
 */
const EngagementDashboardCard = ({ children, title = undefined }: EngagementDashboardCardProps) => (
	<Card>
		{title && <CardTitle>{title}</CardTitle>}
		<CardBody>
			<EngagementDashboardCardErrorBoundary>
				<Stack grow>{children}</Stack>
			</EngagementDashboardCardErrorBoundary>
		</CardBody>
	</Card>
);

export default EngagementDashboardCard;
