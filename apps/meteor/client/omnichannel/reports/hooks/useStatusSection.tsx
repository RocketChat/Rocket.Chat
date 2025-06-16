import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDefaultDownload } from './useDefaultDownload';
import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';
import { round } from '../utils/round';

const STATUSES: Record<string, { label: TranslationKey; color: string }> = {
	Open: { label: 'Omnichannel_Reports_Status_Open', color: COLORS.success },
	Queued: { label: 'Queued', color: COLORS.warning2 },
	On_Hold: { label: 'On_Hold', color: COLORS.warning },
	Closed: { label: 'Omnichannel_Reports_Status_Closed', color: COLORS.danger },
};

const formatChartData = (data: { label: string; value: number }[] | undefined = [], total = 0, t: TFunction) => {
	return data.map((item) => {
		const status = STATUSES[item.label];
		const percentage = total > 0 ? round((item.value / total) * 100) : 0;
		const label = t(status.label);
		return {
			...item,
			id: item.label,
			label: `${label} ${item.value} (${percentage}%)`,
			rawLabel: label,
			color: status.color,
		};
	});
};

export const useStatusSection = () => {
	const { t } = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-status-period', PERIOD_OPTIONS);
	const getConversationsByStatus = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-status');
	const { start, end } = getPeriodRange(period);

	const {
		data: { data, total } = { data: [], total: 0 },
		isPending,
		isError,
		isSuccess,
		refetch,
	} = useQuery({
		queryKey: ['omnichannel-reports', 'conversations-by-status', period, t],

		queryFn: async () => {
			const response = await getConversationsByStatus({ start: start.toISOString(), end: end.toISOString() });

			return { ...response, data: formatChartData(response.data, response.total, t) };
		},

		refetchInterval: 5 * 60 * 1000,
	});

	const title = t('Conversations_by_status');
	const subtitle = t('__count__conversations__period__', {
		count: total ?? 0,
		period: formatPeriodDescription(period, t),
	});
	const emptyStateSubtitle = t('Omnichannel_Reports_Status_Empty_Subtitle');

	const downloadProps = useDefaultDownload({ columnName: t('Status'), title, data, period });

	return useMemo(
		() => ({
			id: 'conversations-by-status',
			title,
			subtitle,
			emptyStateSubtitle,
			data,
			total,
			period,
			periodSelectorProps,
			downloadProps,
			isPending,
			isError,
			isDataFound: isSuccess && data.length > 0,
			onRetry: refetch,
		}),
		[title, subtitle, emptyStateSubtitle, data, total, period, periodSelectorProps, downloadProps, isPending, isError, isSuccess, refetch],
	);
};
