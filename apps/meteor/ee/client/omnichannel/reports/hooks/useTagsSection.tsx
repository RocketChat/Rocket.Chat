import { Palette } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';

import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { MOCK_TAGS_DATA } from '../mock';

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

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(['reports', 'tags', period], () => {
		return Promise.resolve(formatChartData(MOCK_TAGS_DATA.data));
	});

	return {
		data,
		isLoading,
		isError,
		periodSelectorProps,
	};
};
