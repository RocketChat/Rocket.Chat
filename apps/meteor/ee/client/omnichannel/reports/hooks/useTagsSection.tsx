import { Palette } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { PERIOD_OPTIONS } from '../components/constants';
import { useDefaultDownload } from './useDefaultDownload';

const colors = {
	warning: Palette.statusColor['status-font-on-warning'].toString(),
	danger: Palette.statusColor['status-font-on-danger'].toString(),
	success: Palette.statusColor['status-font-on-success'].toString(),
	info: Palette.statusColor['status-font-on-info'].toString(),
};

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		color: colors.info,
	}));

export const useTagsSection = () => {
	const t = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-tags-period', PERIOD_OPTIONS);
	const getConversationsByTags = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-tags');

	const {
		data: { data, total } = { data: [], total: 0 },
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-tags', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsByTags({ start: start.toISOString(), end: end.toISOString() });
			return { ...response, data: formatChartData(response.data) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
			useErrorBoundary: true,
		},
	);

	const title = t('Conversations_by_tag');
	const subtitle = t('__count__tags__period__', {
		count: total ?? 0,
		period,
	});

	const downloadProps = useDefaultDownload({ columnName: t('Tags'), title, data, period });

	return useMemo(
		() => ({
			title,
			subtitle,
			data,
			total,
			isError,
			isLoading,
			isDataFound: isSuccess && data.length > 0,
			periodSelectorProps,
			period,
			downloadProps,
		}),
		[title, subtitle, data, total, isError, isLoading, isSuccess, periodSelectorProps, period, downloadProps],
	);
};
