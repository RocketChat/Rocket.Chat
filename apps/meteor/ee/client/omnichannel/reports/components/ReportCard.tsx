/* eslint-disable @typescript-eslint/naming-convention */
import { Box, Skeleton, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ComponentProps, ReactElement } from 'react';
import React from 'react';

import DownloadDataButton from '../../../components/dashboards/DownloadDataButton';
import type { PeriodSelectorProps } from '../../../components/dashboards/PeriodSelector';
import PeriodSelector from '../../../components/dashboards/PeriodSelector';
import { CardErrorState } from './CardErrorState';

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
	full?: boolean;
	isError?: boolean;
	onRetry?: () => void;
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
	full,
	isError,
	onRetry,
	loadingSkeleton: LoadingSkeleton = <Skeleton style={{ transform: 'none' }} height='100%' />,
}: ReportCardProps) => {
	const t = useTranslation();
	return (
		<Box
			is={Card}
			minWidth={500}
			maxWidth='100%'
			width={full ? '100%' : 'calc(50% - 16px)'}
			height='initial'
			flexGrow={1}
			flexShrink={0}
			overflow='hidden'
			margin={8}
		>
			<Card.Title>
				<Box display='flex' justifyContent='space-between' alignItems='center' wrap='no-wrap'>
					<Box display='flex' flexDirection='column' flexShrink={1} mie={16}>
						<Box is='span' withTruncatedText>
							{title}
						</Box>
						<Box is='span' color='hint' fontScale='p2'>
							{subtitle}
						</Box>
					</Box>
					<Box flexGrow={0} flexShrink={0} display='flex' alignItems='center'>
						<PeriodSelector {...periodSelectorProps} />
						<DownloadDataButton {...downloadProps} size={32} />
					</Box>
				</Box>
			</Card.Title>
			<Card.Body height={height}>
				<Card.Col>
					<CardErrorState isError={isError} onRetry={onRetry}>
						{isLoading && LoadingSkeleton}

						{!isLoading && !isDataFound && (
							<States style={{ height: '100%' }}>
								<StatesIcon name='dashboard' />
								<StatesTitle>{t('No_data_found')}</StatesTitle>
							</States>
						)}

						{!isLoading && isDataFound && children}
					</CardErrorState>
				</Card.Col>
			</Card.Body>
		</Box>
	);
};
