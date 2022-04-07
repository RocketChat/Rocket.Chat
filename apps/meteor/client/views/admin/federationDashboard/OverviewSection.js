import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import CounterSet from '../../../components/data/CounterSet';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { usePolledMethodData } from '../../../hooks/usePolledMethodData';

function OverviewSection() {
	const t = useTranslation();
	const { value: overviewData, phase: overviewStatus } = usePolledMethodData(
		'federation:getOverviewData',
		useMemo(() => [], []),
		10000,
	);

	const eventCount =
		(overviewStatus === AsyncStatePhase.LOADING && <Skeleton variant='text' />) ||
		(overviewStatus === AsyncStatePhase.REJECTED && <Box color='danger'>Error</Box>) ||
		overviewData?.data[0]?.value;
	const userCount =
		(overviewStatus === AsyncStatePhase.LOADING && <Skeleton variant='text' />) ||
		(overviewStatus === AsyncStatePhase.REJECTED && <Box color='danger'>Error</Box>) ||
		overviewData?.data[1]?.value;
	const serverCount =
		(overviewStatus === AsyncStatePhase.LOADING && <Skeleton variant='text' />) ||
		(overviewStatus === AsyncStatePhase.REJECTED && <Box color='danger'>Error</Box>) ||
		overviewData?.data[2]?.value;

	return (
		<CounterSet
			counters={[
				{
					count: eventCount,
					description: t('Number_of_events'),
				},
				{
					count: userCount,
					description: t('Number_of_federated_users'),
				},
				{
					count: serverCount,
					description: t('Number_of_federated_servers'),
				},
			]}
		/>
	);
}

export default OverviewSection;
