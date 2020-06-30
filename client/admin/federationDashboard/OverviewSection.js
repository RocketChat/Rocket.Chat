import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import CounterSet from '../../components/data/CounterSet';
import { usePolledMethodData, AsyncState } from '../../contexts/ServerContext';

function OverviewSection() {
	const t = useTranslation();
	const [overviewData, overviewStatus] = usePolledMethodData('federation:getOverviewData', [], 10000);

	const eventCount = (overviewStatus === AsyncState.LOADING && <Skeleton variant='text' />)
		|| (overviewStatus === AsyncState.ERROR && <Box color='danger'>Error</Box>)
		|| overviewData?.data[0]?.value;
	const userCount = (overviewStatus === AsyncState.LOADING && <Skeleton variant='text' />)
	|| (overviewStatus === AsyncState.ERROR && <Box color='danger'>Error</Box>)
		|| overviewData?.data[1]?.value;
	const serverCount = (overviewStatus === AsyncState.LOADING && <Skeleton variant='text' />)
	|| (overviewStatus === AsyncState.ERROR && <Box color='danger'>Error</Box>)
		|| overviewData?.data[2]?.value;

	return <CounterSet
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
	/>;
}

export default OverviewSection;
