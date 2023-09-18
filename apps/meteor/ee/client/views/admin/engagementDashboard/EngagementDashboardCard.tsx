import { Box } from '@rocket.chat/fuselage';
import { Card, CardBody, CardCol, CardTitle } from '@rocket.chat/ui-client';
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
			{title && <CardTitle>{title}</CardTitle>}
			<CardBody>
				<CardCol>
					<EngagementDashboardCardErrorBoundary>
						<Box>{children}</Box>
					</EngagementDashboardCardErrorBoundary>
				</CardCol>
			</CardBody>
		</Card>
	</Box>
);

export default EngagementDashboardCard;
