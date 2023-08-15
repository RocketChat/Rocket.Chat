import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';
import { round } from '../utils/round';
import { useDefaultDownload } from './useDefaultDownload';

const getTop5 = (data: { label: string; value: number }[] | undefined = []) => {
	const top5Channels = data.slice(0, 5);
	const otherChannels = data.slice(5).reduce(
		(acc, item) => {
			acc.value += item.value;
			return acc;
		},
		{ label: 'Others', value: 0 },
	);
	return [...top5Channels, otherChannels];
};

const formatChartData = (data: { label: string; value: number }[] | undefined = [], total = 0) => {
	const displayedData = data.length > 5 ? getTop5(data) : data;
	return displayedData.map((item, i) => {
		const percentage = round((item.value / total) * 100);
		return {
			...item,
			label: `${item.label} (${percentage}%)`,
			rawLabel: item.label,
			id: `${item.label}_${i}`,
		};
	});
};

export const useChannelsSection = () => {
	const t = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-channels-period', PERIOD_OPTIONS);
	const getConversationsBySource = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-source');

	const {
		data: { data, total } = { data: [], total: 0 },
		refetch,
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-source', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsBySource({ start: start.toISOString(), end: end.toISOString() });
			return { ...response, data: formatChartData(response.data, response.total) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
		},
	);

	const title = t('Conversations_by_channel');
	const subtitle = t('__count__conversations__period__', {
		count: total ?? 0,
		period: formatPeriodDescription(period, t),
	});

	const downloadProps = useDefaultDownload({ columnName: t('Channel'), title, data, period });

	return useMemo(
		() => ({
			title,
			subtitle,
			data,
			total,
			isLoading,
			isError,
			isDataFound: isSuccess && data.length > 0,
			periodSelectorProps,
			period,
			downloadProps,
			onRetry: refetch,
		}),
		[title, subtitle, data, total, isLoading, isError, isSuccess, periodSelectorProps, period, downloadProps, refetch],
	);
};
