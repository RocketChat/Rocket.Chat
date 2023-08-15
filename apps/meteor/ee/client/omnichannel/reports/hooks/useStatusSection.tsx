import type { TranslationContextValue, TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';
import { useDefaultDownload } from './useDefaultDownload';

const STATUSES: Record<string, { label: TranslationKey; color: string }> = {
	Open: { label: 'Report_Status_Open', color: COLORS.success },
	Queued: { label: 'Queued', color: COLORS.info },
	On_Hold: { label: 'On_Hold', color: COLORS.warning },
	Closed: { label: 'Report_Status_Closed', color: COLORS.danger },
};

const formatChartData = (data: { label: string; value: number }[] | undefined = [], t: TranslationContextValue['translate']) => {
	return data.map((item) => {
		const status = STATUSES[item.label];
		return { ...item, id: item.label, label: t(status.label), color: status.color };
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
	} = useQuery(
		['omnichannel-reports', 'conversations-by-status', period, t],
		async () => {
			const response = await getConversationsByStatus({ start: start.toISOString(), end: end.toISOString() });

			return { ...response, data: formatChartData(response.data, t) };
		},
		{
			refetchInterval: 5 * 60 * 1000,
			useErrorBoundary: true,
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
			isLoading,
			isError,
			isDataFound: isSuccess && data.length > 0,
			periodSelectorProps,
			downloadProps,
			period,
		}),
		[title, subtitle, data, total, isLoading, isError, isSuccess, periodSelectorProps, downloadProps, period],
	);
};
