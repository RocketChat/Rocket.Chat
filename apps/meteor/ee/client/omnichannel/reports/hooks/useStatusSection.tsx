import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { COLORS } from '../components/constants';

const STATUS_COLORS: Record<string, string> = {
	'Open': COLORS.success,
	'Queued': COLORS.info,
	'On hold': COLORS.warning,
	'Closed': COLORS.danger,
};

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({ ...item, id: item.label, color: STATUS_COLORS[item.label] }));

export const useStatusSection = () => {
	const [period, periodSelectorProps] = usePeriodSelectorState(
		'today',
		'this week',
		'last 15 days',
		'this month',
		'last 6 months',
		'last year',
	);

	const { start, end } = getPeriodRange(period);

	const getConversationsByStatus = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-status');

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(['reports', 'status', 'livechat/analytics/dashboards/conversations-by-status', period], async () => {
		const { data } = await getConversationsByStatus({ start: start.toISOString(), end: end.toISOString() });
		return formatChartData(data);
	});

	return {
		data,
		isLoading,
		isError,
		periodSelectorProps,
	};
};
