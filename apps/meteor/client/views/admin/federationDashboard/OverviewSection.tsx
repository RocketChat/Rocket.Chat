import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CounterSet from '../../../components/dataView/CounterSet';

const useOverviewData = (): [eventCount: ReactNode, userCount: ReactNode, serverCount: ReactNode] => {
	const getFederationOverviewData = useMethod('federation:getOverviewData');

	const result = useQuery({
		queryKey: ['admin/federation-dashboard/overview'],
		queryFn: async () => getFederationOverviewData(),
		refetchInterval: 10_000,
	});

	if (result.isPending) {
		return [
			<Skeleton key='event-count' variant='text' />,
			<Skeleton key='user-count' variant='text' />,
			<Skeleton key='server-count' variant='text' />,
		];
	}

	if (result.isError) {
		return [
			<Box key='event-count' color='status-font-on-danger'>
				Error
			</Box>,
			<Box key='user-count' color='status-font-on-danger'>
				Error
			</Box>,
			<Box key='server-count' color='status-font-on-danger'>
				Error
			</Box>,
		];
	}

	const { data } = result.data;

	return [data[0].value, data[1].value, data[2].value];
};

function OverviewSection(): ReactElement {
	const { t } = useTranslation();

	const [eventCount, userCount, serverCount] = useOverviewData();

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
