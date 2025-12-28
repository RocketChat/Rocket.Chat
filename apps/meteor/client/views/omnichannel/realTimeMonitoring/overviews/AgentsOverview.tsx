import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef } from 'react';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: '-',
};

type AgentsOverviewChartsProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const initialData = [overviewInitalValue, overviewInitalValue, overviewInitalValue];

const AgentsOverview = ({ departmentId, dateRange, ...props }: AgentsOverviewChartsProps) => {
	const getAgentsProductivityTotals = useEndpoint('GET', '/v1/livechat/analytics/dashboards/agents-productivity-totalizers');
	const { data = initialData } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.agentsProductivityTotals(departmentId, dateRange),
		queryFn: async () => {
			const { totalizers } = await getAgentsProductivityTotals({ departmentId, ...dateRange });
			return totalizers;
		},
	});

	return <CounterContainer totals={data} {...props} />;
};

export default AgentsOverview;
