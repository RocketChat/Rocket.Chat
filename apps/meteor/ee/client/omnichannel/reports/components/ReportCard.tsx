import { Box, Card, CardHeader, CardTitle, CardBody, CardCol, CardRow } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React, { forwardRef } from 'react';

import DownloadDataButton from '../../../components/dashboards/DownloadDataButton';
import PeriodSelector from '../../../components/dashboards/PeriodSelector';
import { ReportCardContent } from './ReportCardContent';

type ReportCardProps = {
	id: string;
	title: string;
	children: ReactElement;
	periodSelectorProps: ComponentProps<typeof PeriodSelector>;
	downloadProps: ComponentProps<typeof DownloadDataButton>;
	isLoading?: boolean;
	isDataFound?: boolean;
	minHeight?: number;
	subtitle?: string;
	emptyStateSubtitle?: string;
	isError?: boolean;
	onRetry?: () => void;
	chartHeight?: number;
};

export const ReportCard = forwardRef<HTMLElement, ReportCardProps>(function ReportCard(
	{ id, title, children, periodSelectorProps, downloadProps, isLoading, isDataFound, subtitle, emptyStateSubtitle, isError, onRetry },
	ref,
) {
	return (
		<Box h='full' ref={ref}>
			<Card height='full' aria-busy={isLoading} data-qa={id}>
				<CardHeader>
					<CardCol>
						<CardTitle>{title}</CardTitle>
						<Box is='span' color='hint' fontScale='c1' data-qa='report-summary'>
							{subtitle}
						</Box>
					</CardCol>
					<CardCol>
						<CardRow>
							<PeriodSelector name='periodSelector' {...periodSelectorProps} />
							<DownloadDataButton {...downloadProps} title='Download CSV' size={32} />
						</CardRow>
					</CardCol>
				</CardHeader>
				<CardBody flexDirection='column' h='full'>
					<Box h='full' display='flex' flexDirection='column' justifyContent='center'>
						<ReportCardContent
							isLoading={isLoading}
							isDataFound={isDataFound}
							isError={isError}
							onRetry={onRetry}
							subtitle={emptyStateSubtitle}
						>
							{children}
						</ReportCardContent>
					</Box>
				</CardBody>
			</Card>
		</Box>
	);
});
