/* eslint-disable @typescript-eslint/naming-convention */
import { Box, Skeleton, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ComponentProps, ReactElement } from 'react';
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
	isLoading?: boolean;
	isDataFound?: boolean;
	height?: number;
	loadingSkeleton?: ReactElement;
	subtitle?: string;
};

export const ReportCard = ({
	title,
	children,
	periodSelectorProps,
	downloadProps,
	isLoading,
	isDataFound,
	height,
	subtitle,
	loadingSkeleton: LoadingSkeleton = <Skeleton style={{ transform: 'none' }} height='100%' />,
}: ReportCardProps) => {
	const t = useTranslation();
	return (
		<Box is={Card} minWidth='calc(50% - 16px)' flexGrow={1} overflow='hidden' margin={8}>
			<Card.Title>
				<Box display='flex' justifyContent='space-between' alignItems='center' wrap='no-wrap'>
					<Box display='flex' flexDirection='column'>
						<Box>{title}</Box>
						<Box color='hint' fontScale='p2' withTruncatedText>
							{subtitle}
						</Box>
					</Box>
					<Box flexGrow={0} display='flex' alignItems='center'>
						<PeriodSelector {...periodSelectorProps} />
						<DownloadDataButton {...downloadProps} size={32} />
					</Box>
				</Box>
			</Card.Title>
			<Card.Body height={height}>
				<Card.Col>
					<CardErrorBoundary>
						{isLoading && LoadingSkeleton}

						{!isLoading && !isDataFound && (
							<States style={{ height: '100%' }}>
								<StatesIcon name='dashboard' />
								<StatesTitle>{t('No_data_yet')}</StatesTitle>
							</States>
						)}

						{!isLoading && isDataFound && children}
					</CardErrorBoundary>
				</Card.Col>
			</Card.Body>
		</Box>
	);
};
