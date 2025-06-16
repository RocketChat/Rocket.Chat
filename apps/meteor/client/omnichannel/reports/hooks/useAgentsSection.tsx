import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDefaultDownload } from './useDefaultDownload';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorStorage } from '../../../components/dashboards/usePeriodSelectorStorage';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';
import { formatPeriodDescription } from '../utils/formatPeriodDescription';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		color: COLORS.info,
	}));

export const useAgentsSection = () => {
	const { t } = useTranslation();
	const [period, periodSelectorProps] = usePeriodSelectorStorage('reports-agents-period', PERIOD_OPTIONS);
	const getConversationsByAgent = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-agent');
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'total'>('total', 'desc');

	const {
		data: { data, total = 0, unspecified = 0 } = { data: [], total: 0 },
		refetch,
		isPending,
		isError,
		isSuccess,
	} = useQuery({
		queryKey: ['omnichannel-reports', 'conversations-by-agent', period, sortBy, sortDirection],

		queryFn: async () => {
			const { start, end } = getPeriodRange(period);
			const response = await getConversationsByAgent({
				start: start.toISOString(),
				end: end.toISOString(),
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			});
			return { ...response, data: formatChartData(response.data) };
		},

		refetchInterval: 5 * 60 * 1000,
	});

	const title = t('Conversations_by_agents');

	const subtitleTotals = t('__agents__agents_and__count__conversations__period__', {
		agents: data.length ?? 0,
		count: total,
		period: formatPeriodDescription(period, t),
	});
	const subtitleUnspecified = unspecified > 0 ? `(${t('__count__without__assignee__', { count: unspecified })})` : '';
	const subtitle = `${subtitleTotals} ${subtitleUnspecified}`;
	const emptyStateSubtitle = t('Omnichannel_Reports_Agents_Empty_Subtitle');

	const downloadProps = useDefaultDownload({ columnName: t('Agents'), title, data, period });

	return useMemo(
		() => ({
			id: 'conversations-by-agent',
			title,
			subtitle,
			emptyStateSubtitle,
			data,
			total,
			isPending,
			isError,
			isDataFound: isSuccess && data.length > 0,
			periodSelectorProps,
			period,
			downloadProps,
			sortBy,
			sortDirection,
			setSort,
			onRetry: refetch,
		}),
		[
			title,
			subtitle,
			emptyStateSubtitle,
			data,
			total,
			isPending,
			isError,
			isSuccess,
			periodSelectorProps,
			period,
			downloadProps,
			sortBy,
			sortDirection,
			setSort,
			refetch,
		],
	);
};
