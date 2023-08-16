import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';
import { useDefaultDownload } from './useDefaultDownload';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		color: COLORS.info,
	}));

export const useDepartmentsSection = () => {
	const t = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-department-period', PERIOD_OPTIONS);
	const getConversationsByDepartment = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-department');

	const {
		data: { data, total = 0, unspecified = 0 } = { data: [], total: 0 },
		isLoading,
		isError,
		isSuccess,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-department', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsByDepartment({ start: start.toISOString(), end: end.toISOString() });
			return { ...response, data: formatChartData(response.data) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
		},
	);

	const title = t('Conversations_by_department');
	const subtitleTotals = t('__departments__departments_and__count__conversations__period__', {
		departments: data.length ?? 0,
		count: total,
		period: formatPeriodDescription(period, t),
	});
	const subtitleUnspecified = unspecified > 0 ? `(${t('__count__without__department__', { count: unspecified })})` : '';
	const subtitle = `${subtitleTotals} ${subtitleUnspecified}`;

	const downloadProps = useDefaultDownload({ columnName: t('Departments'), title, data, period });

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
		}),
		[title, subtitle, data, total, isLoading, isError, isSuccess, periodSelectorProps, period, downloadProps],
	);
};
