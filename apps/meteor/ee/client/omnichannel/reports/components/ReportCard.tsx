/* eslint-disable @typescript-eslint/naming-convention */
import { Box, Skeleton, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ComponentProps, ReactElement } from 'react';
import React from 'react';

import DownloadDataButton from '../../../components/dashboards/DownloadDataButton';
import PeriodSelector from '../../../components/dashboards/PeriodSelector';
import { useIsResizing } from '../hooks/useIsResizing';
import { CardErrorState } from './CardErrorState';

type ReportCardProps = {
	title: string;
	children: ReactNode;
	periodSelectorProps: ComponentProps<typeof PeriodSelector>;
	downloadProps: ComponentProps<typeof DownloadDataButton>;
	isLoading?: boolean;
	isDataFound?: boolean;
	minHeight?: number;
	loadingSkeleton?: ReactElement;
	subtitle?: string;
	emptyStateSubtitle?: string;
	full?: boolean;
	isError?: boolean;
	onRetry?: () => void;
};

export const ReportCard = ({
	title,
	children,
	periodSelectorProps,
	downloadProps,
	isLoading: isLoadingData,
	isDataFound,
	minHeight,
	subtitle,
	emptyStateSubtitle,
	full,
	isError,
	onRetry,
	loadingSkeleton: LoadingSkeleton = <Skeleton style={{ transform: 'none' }} height='100%' />,
}: ReportCardProps) => {
	const t = useTranslation();
	const width = full ? '100%' : '50%';
	const isResizing = useIsResizing();
	const isLoading = isLoadingData || isResizing;

	return (
		<Box
			is={Card}
			maxWidth='calc(100% - 16px)'
			minWidth={`calc(${width} - 16px)`}
			height='initial'
			flexGrow={1}
			flexShrink={0}
			flexBasis='auto'
			margin={8}
		>
			<Card.Title>
				<Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' style={{ rowGap: 8 }}>
					<Box display='flex' flexDirection='column' flexShrink={1} mie={16}>
						<Box is='span' withTruncatedText>
							{title}
						</Box>
						<Box is='span' color='hint' fontScale='c1'>
							{subtitle}
						</Box>
					</Box>
					<Box flexGrow={0} flexShrink={0} display='flex' alignItems='center'>
						<PeriodSelector {...periodSelectorProps} />
						<DownloadDataButton {...downloadProps} title='Download CSV' size={32} />
					</Box>
				</Box>
			</Card.Title>
			<Card.Body>
				<Card.Col>
					<Box minHeight={minHeight}>
						<CardErrorState isError={isError} onRetry={onRetry}>
							{isLoading && LoadingSkeleton}

							{!isLoading && !isDataFound && (
								<States style={{ height: '100%' }}>
									<StatesIcon name='dashboard' />
									<StatesTitle>{t('No_data_available_for_the_selected_period')}</StatesTitle>
									<StatesSubtitle>{emptyStateSubtitle}</StatesSubtitle>
								</States>
							)}

							{!isLoading && isDataFound && children}
						</CardErrorState>
					</Box>
				</Card.Col>
			</Card.Body>
		</Box>
	);
};
