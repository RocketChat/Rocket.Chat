import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';
import { getTop } from '../utils/getTop';
import { round } from '../utils/round';
import { useDefaultDownload } from './useDefaultDownload';

type DataItem = { label: string; value: number; id: string; rawLabel: string };

const formatItem = (item: { label: string; value: number }, total: number): DataItem => {
	const percentage = round((item.value / total) * 100);
	return {
		...item,
		label: `${item.label} ${item.value} (${percentage}%)`,
		rawLabel: item.label,
		id: `${item.label}_${item.value}`,
	};
};

const formatChartData = (data: { label: string; value: number }[] | undefined = [], total = 0) => {
	return data.map((item) => formatItem(item, total));
};

export const useChannelsSection = () => {
	const t = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-channels-period', PERIOD_OPTIONS);
	const getConversationsBySource = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-source');

	const {
		data: { data, rawData, total } = { data: [], rawData: [], total: 0 },
		refetch,
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-source', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsBySource({ start: start.toISOString(), end: end.toISOString() });
			const data = formatChartData(response.data, response.total);
			const displayData: DataItem[] = getTop<DataItem>(5, data, (value) => formatItem({ label: t('Others'), value }, total));
			return { ...response, data: displayData, rawData: data };
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

	const downloadProps = useDefaultDownload({ columnName: t('Channel'), title, data: rawData, period });

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
