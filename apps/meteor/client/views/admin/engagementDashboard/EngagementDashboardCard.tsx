import { Box, Card, CardTitle, CardBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import EngagementDashboardCardErrorBoundary from './EngagementDashboardCardErrorBoundary';

type EngagementDashboardCardProps = {
	children?: ReactNode;
	title?: string;
};

const EngagementDashboardCard = ({ children, title = undefined }: EngagementDashboardCardProps) => (
	<Box mb={16}>
		<Card>
			{title && <CardTitle>{title}</CardTitle>}
			<CardBody>
				<EngagementDashboardCardErrorBoundary>
					<Box w='full'>{children}</Box>
				</EngagementDashboardCardErrorBoundary>
			</CardBody>
		</Card>
	</Box>
);

export default EngagementDashboardCard;
