import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import type { AnalyticsGridItemProps } from '../AnalyticsLayoutProps';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: 0,
};

const initialData = [overviewInitalValue, overviewInitalValue, overviewInitalValue, overviewInitalValue];

export type ConversationOverviewProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & AnalyticsGridItemProps;

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
