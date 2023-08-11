import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item, i) => ({
		...item,
		id: item.label,
		color: Object.values(COLORS)[i],
	}));

export const useChannelsSection = () => {
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-channels-period', PERIOD_OPTIONS);
	const getConversationsBySource = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-source');

	const {
		data: { data, total } = { data: [], total: 0 },
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-source', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsBySource({ start: start.toISOString(), end: end.toISOString() });
			return { ...response, data: formatChartData(response.data) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
			useErrorBoundary: true,
		},
	);

	const downloadProps = useMemo(
		() => ({
			attachmentName: 'Conversations_by_channel',
			headers: ['Date', 'Messages'],
			dataAvailable: data.length > 0,
			dataExtractor(): unknown[][] | undefined {
				return data?.map(({ label, value }) => [label, value]);
			},
		}),
		[data],
	);

	return useMemo(
		() => ({
			data,
			total,
			isLoading,
			isError,
			isDataFound: isSuccess && data.length > 0,
			periodSelectorProps,
			period,
			downloadProps,
		}),
		[data, total, isLoading, isError, isSuccess, periodSelectorProps, period, downloadProps],
	);
};
