import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef } from 'react';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import CounterContainer from '../counter/CounterContainer';

const defaultValue = { title: '', value: '00:00:00' };

const initialData = [defaultValue, defaultValue, defaultValue, defaultValue];

type ProductivityOverviewProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ProductivityOverview = ({ departmentId, dateRange, ...props }: ProductivityOverviewProps) => {
	const getProductivityTotals = useEndpoint('GET', '/v1/livechat/analytics/dashboards/productivity-totalizers');
	const { data = initialData } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.productivityTotals(departmentId, dateRange),
		queryFn: async () => {
			const { totalizers } = await getProductivityTotals({ departmentId, ...dateRange });
			return totalizers;
		},
	});

	return <CounterContainer totals={data} {...props} />;
};

export default ProductivityOverview;
