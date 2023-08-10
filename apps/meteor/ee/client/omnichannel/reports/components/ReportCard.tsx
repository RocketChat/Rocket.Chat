import { Box } from '@rocket.chat/fuselage';
import { Card, CardTitle, CardBody, CardCol } from '@rocket.chat/ui-client';
import type { ReactNode, ComponentProps } from 'react';
import React from 'react';

import DownloadDataButton from '../../../components/dashboards/DownloadDataButton';
import type { PeriodSelectorProps } from '../../../components/dashboards/PeriodSelector';
import PeriodSelector from '../../../components/dashboards/PeriodSelector';
import { CardErrorBoundary } from './CardErrorBoundary';

type ReportCardProps = {
	title: string;
	children: ReactNode;
	periodSelectorProps: PeriodSelectorProps<any>;
	downloadProps: ComponentProps<typeof DownloadDataButton>;
	data?: {
		id: string;
		label: string;
		value: number;
		color: string;
	}[];
};

export const ReportCard = ({ title, children, periodSelectorProps, downloadProps }: ReportCardProps) => {
	return (
		<Card overflow='hidden'>
			<Card.Title>
				<Box display='flex' justifyContent='space-between' alignItems='center' wrap='no-wrap'>
					{title}
					<Box flexGrow={0} display='flex' alignItems='center'>
						<PeriodSelector {...periodSelectorProps} />
						<DownloadDataButton {...downloadProps} size={32} />
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
