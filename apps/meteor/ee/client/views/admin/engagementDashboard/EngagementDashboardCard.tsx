import { Box } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import EngagementDashboardCardErrorBoundary from './EngagementDashboardCardErrorBoundary';

type EngagementDashboardCardProps = {
	children?: ReactNode;
	title?: string;
};

const EngagementDashboardCard = ({ children, title = undefined }: EngagementDashboardCardProps): ReactElement => (
	<Box mb={16}>
		<Card>
			{title && <Card.Title>{title}</Card.Title>}
			<Card.Body>
				<Card.Col>
					<EngagementDashboardCardErrorBoundary>
						<Box>{children}</Box>
					</EngagementDashboardCardErrorBoundary>
				</Card.Col>
			</Card.Body>
		</Card>
	</Box>
);

export default EngagementDashboardCard;
