import { Palette } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';

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
	const [period, periodSelectorProps] = usePeriodSelectorState(
		'today',
		'this week',
		'last 15 days',
		'this month',
		'last 6 months',
		'last year',
	);

	const { start, end } = getPeriodRange(period);

	const getConversationsByTags = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-tags');

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(['reports', 'tags', period], async () => {
		const { data } = await getConversationsByTags({ start: start.toISOString(), end: end.toISOString() });
		return formatChartData(data);
	});

	return {
		data,
		isLoading,
		isError,
		periodSelectorProps,
	};
};
