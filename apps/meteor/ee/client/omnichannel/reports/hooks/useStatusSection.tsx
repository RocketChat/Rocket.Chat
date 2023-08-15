import type { TranslationContextValue, TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';
import { round } from '../utils/round';
import { useDefaultDownload } from './useDefaultDownload';

const STATUSES: Record<string, { label: TranslationKey; color: string }> = {
	Open: { label: 'Omnichannel_Reports_Status_Open', color: COLORS.success },
	Queued: { label: 'Queued', color: COLORS.info },
	On_Hold: { label: 'On_Hold', color: COLORS.warning },
	Closed: { label: 'Omnichannel_Reports_Status_Closed', color: COLORS.danger },
};

const formatChartData = (data: { label: string; value: number }[] | undefined = [], total = 0, t: TranslationContextValue['translate']) => {
	return data.map((item) => {
		const status = STATUSES[item.label];
		const percentage = round((item.value / total) * 100);
		return { ...item, id: item.label, label: `${t(status.label)} (${percentage}%)`, color: status.color };
	});
};

export const useStatusSection = () => {
	const t = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-status-period', PERIOD_OPTIONS);
	const getConversationsByStatus = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-status');
	const { start, end } = getPeriodRange(period);

	const {
		data: { data, total } = { data: [], total: 0 },
		isLoading,
		isError,
		isSuccess,
		refetch,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-status', period, t],
		async () => {
			const response = await getConversationsByStatus({ start: start.toISOString(), end: end.toISOString() });

			return { ...response, data: formatChartData(response.data, response.total, t) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
		},
	);

	const title = t('Conversations_by_status');
	const subtitle = t('__count__conversations__period__', {
		count: total ?? 0,
		period: formatPeriodDescription(period, t),
	});

	const downloadProps = useDefaultDownload({ columnName: t('Status'), title, data, period });

	return useMemo(
		() => ({
			title,
			subtitle,
			data,
			total,
			period,
			periodSelectorProps,
			downloadProps,
			isLoading,
			isError,
			isDataFound: isSuccess && data.length > 0,
			onRetry: refetch,
		}),
		[title, subtitle, data, total, period, periodSelectorProps, downloadProps, isLoading, isError, isSuccess, refetch],
	);
};
