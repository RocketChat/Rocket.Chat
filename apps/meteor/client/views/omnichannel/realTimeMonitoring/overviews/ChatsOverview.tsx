import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef } from 'react';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import CounterContainer from '../counter/CounterContainer';

const initialData = [
	{ title: '', value: 0 },
	{ title: '', value: '0%' },
	{ title: '', value: '00:00:00' },
];

type ChatsOverviewProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ChatsOverview = ({ departmentId, dateRange, ...props }: ChatsOverviewProps) => {
	const getChatsTotalizers = useEndpoint('GET', '/v1/livechat/analytics/dashboards/chats-totalizers');
	const { data = initialData } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.chatsTotals(departmentId, dateRange),
		queryFn: async () => {
			const { totalizers } = await getChatsTotalizers({ departmentId, ...dateRange });
			return totalizers;
		},
	});

	return <CounterContainer totals={data} {...props} />;
};

export default ChatsOverview;
