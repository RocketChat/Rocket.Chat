import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef } from 'react';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: 0,
};

const initialData = [overviewInitalValue, overviewInitalValue, overviewInitalValue, overviewInitalValue];

type ConversationOverviewProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ConversationOverview = ({ departmentId, dateRange, ...props }: ConversationOverviewProps) => {
	const getConversationTotals = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversation-totalizers');
	const { data = initialData } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.conversationTotals(departmentId, dateRange),
		queryFn: async () => {
			const { totalizers } = await getConversationTotals({ departmentId, ...dateRange });
			return totalizers;
		},
	});

	return <CounterContainer totals={data} {...props} />;
};

export default ConversationOverview;
