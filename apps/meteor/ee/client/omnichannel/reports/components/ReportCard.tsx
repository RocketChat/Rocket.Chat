import { Box } from '@rocket.chat/fuselage';
import { Card, CardTitle, CardBody, CardCol } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import React from 'react';

import type { PeriodSelectorProps } from '../../../components/dashboards/PeriodSelector';
import PeriodSelector from '../../../components/dashboards/PeriodSelector';
import { CardErrorBoundary } from './CardErrorBoundary';
import DownloadDataButton from './DownloadDataButton';

type ReportCardProps = {
	title: string;
	children: ReactNode;
	periodSelectorProps: PeriodSelectorProps<any>;
	data?: {
		id: string;
		label: string;
		value: number;
		color: string;
	}[];
};

export const ReportCard = ({ title, children, periodSelectorProps, data }: ReportCardProps) => {
	return (
		<Card overflow='hidden'>
			<Card.Title>
				<Box display='flex' justifyContent='space-between' alignItems='center' wrap='no-wrap'>
					{title}
					<Box flexGrow={0} display='flex'>
						<PeriodSelector {...periodSelectorProps} />
						<DownloadDataButton
							// attachmentName={`${title}_start_${data?.start}_end_${data?.end}`}
							attachmentName={`${title}`}
							headers={['Date', 'Messages']}
							dataAvailable={!!data}
							dataExtractor={(): unknown[][] | undefined => data?.map(({ label, value }) => [label, value])}
							size={32}
						/>
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
