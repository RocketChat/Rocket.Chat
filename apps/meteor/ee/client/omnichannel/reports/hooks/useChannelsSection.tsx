import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		id: item.label,
		color: COLORS.info,
	}));

export const useChannelsSection = () => {
	const [period, periodSelectorProps] = usePeriodSelectorState(...PERIOD_OPTIONS);
	const getConversationsBySource = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-source');

	const {
		data: endpointRes = { data: [], total: 0 },
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-source', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const endpointRes = await getConversationsBySource({ start: start.toISOString(), end: end.toISOString() });
			return { ...endpointRes, data: formatChartData(endpointRes.data) };
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
			dataAvailable: endpointRes.data.length > 0,
			dataExtractor(): unknown[][] | undefined {
				return endpointRes.data?.map(({ label, value }) => [label, value]);
			},
		}),
		[endpointRes.data],
	);

	return useMemo(
		() => ({
			data: endpointRes.data,
			total: endpointRes.total,
			isLoading,
			isError,
			isDataFound: isSuccess && endpointRes.data.length > 0,
			periodSelectorProps,
			period,
			downloadProps,
		}),
		[endpointRes.data, endpointRes.total, isLoading, isError, isSuccess, periodSelectorProps, period, downloadProps],
	);
};
