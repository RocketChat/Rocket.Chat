import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ReactNode } from 'react';

import Card from '../../../../../client/components/Card';
import EngagementDashboardCardErrorBoundary from './EngagementDashboardCardErrorBoundary';

type EngagementDashboardCardProps = {
	children?: ReactNode;
	title?: string;
};

const EngagementDashboardCard = ({ children, title = undefined }: EngagementDashboardCardProps): ReactElement => {
	const styleProps = {
		fontScale: 'h4',
	};

	return (
		<Card variant='light' mb='x16'>
			{title && <Card.Title {...styleProps}>{title}</Card.Title>}
			<Card.Body>
				<Card.Col>
					<EngagementDashboardCardErrorBoundary>
						<Box>{children}</Box>
					</EngagementDashboardCardErrorBoundary>
				</Card.Col>
			</Card.Body>
		</Card>
	);
};

export default EngagementDashboardCard;
