import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { omnichannelQueryKeys } from '../../../lib/queryKeys';
import CounterItem from '../realTimeMonitoring/counter/CounterItem';
import CounterRow from '../realTimeMonitoring/counter/CounterRow';

const initialData: { title?: string; value: string | number }[] = Array.from({ length: 3 }).map(() => ({ title: undefined, value: '' }));

const conversationsInitialData = [initialData, initialData];
const productivityInitialData = [initialData];

export type OverviewProps = { type: string; dateRange: { start: string; end: string }; departmentId: string };

const Overview = ({ type, dateRange, departmentId }: OverviewProps) => {
	const { t } = useTranslation();

	const { start, end } = dateRange;

	const params = useMemo(
		() => ({
			name: type,
			from: start,
			to: end,
			...(departmentId && { departmentId }),
		}),
		[departmentId, end, start, type],
	);

	const loadData = useEndpoint('GET', '/v1/livechat/analytics/overview');

	const { data: displayData = type === 'Conversations' ? conversationsInitialData : productivityInitialData } = useQuery({
		queryKey: [...omnichannelQueryKeys.analytics.all(departmentId), 'overview', params],
		queryFn: () => loadData(params),
		enabled: !!start && !!end,
		select: (value) => (value.length > 3 ? [value.slice(0, 3), value.slice(3)] : [value]),
	});

	return (
		<Box paddingBlock={28} flexDirection='column'>
			{displayData.map((items = [], i) => (
				<CounterRow key={i} border='0' paddingBlock='none'>
					{items.map(({ title, value }, i) => (
						<CounterItem
							flexShrink={1}
							paddingBlock={8}
							flexBasis='100%'
							key={i}
							title={title ? t(title as TranslationKey) : <Skeleton width='x60' />}
							count={value}
						/>
					))}
				</CounterRow>
			))}
		</Box>
	);
};

export default Overview;
