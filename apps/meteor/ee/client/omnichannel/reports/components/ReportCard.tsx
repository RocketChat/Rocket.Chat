import { Box } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import React from 'react';

import type { PeriodSelectorProps } from '../../../components/dashboards/PeriodSelector';
import PeriodSelector from '../../../components/dashboards/PeriodSelector';
import { CardErrorBoundary } from './CardErrorBoundary';

type ReportCardProps = {
	title: string;
	children: ReactNode;
	periodSelectorProps: PeriodSelectorProps<any>;
};

export const ReportCard = ({ title, children, periodSelectorProps }: ReportCardProps) => {
	return (
		<Card overflow='hidden'>
			<Card.Title>
				<Box display='flex' justifyContent='space-between' alignItems='center' wrap='no-wrap'>
					{title}
					<Box flexGrow={0}>
						<PeriodSelector {...periodSelectorProps} />
					</Box>
				</Box>
			</Card.Title>
			<Card.Body>
				<Card.Col>
					<CardErrorBoundary>{children}</CardErrorBoundary>
				</Card.Col>
			</Card.Body>
		</Card>
	);
};
