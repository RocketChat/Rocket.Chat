import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';

const STATUS_COLORS: Record<string, string> = {
	'Open': COLORS.success,
	'Queued': COLORS.info,
	'On hold': COLORS.warning,
	'Closed': COLORS.danger,
};

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({ ...item, id: item.label, color: STATUS_COLORS[item.label] }));

export const useStatusSection = () => {
	const [period, periodSelectorProps] = usePeriodSelectorState(...PERIOD_OPTIONS);
	const getConversationsByStatus = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-status');

	const {
		data: { data, total } = { data: [], total: 0 },
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-status', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsByStatus({ start: start.toISOString(), end: end.toISOString() });

			return { ...response, data: formatChartData(response.data) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
			useErrorBoundary: true,
		},
	);

	const downloadProps = useMemo(
		() => ({
			attachmentName: 'Conversations_by_status',
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
			downloadProps,
			period,
		}),
		[data, total, isLoading, isError, isSuccess, periodSelectorProps, downloadProps, period],
	);
};
