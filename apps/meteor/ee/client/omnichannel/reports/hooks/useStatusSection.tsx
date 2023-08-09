import { useQuery } from '@tanstack/react-query';

import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { COLORS } from '../components/constants';
import { MOCK_STATUS_DATA } from '../mock';

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

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(['reports', 'status', period], () => {
		return Promise.resolve(formatChartData(MOCK_STATUS_DATA.data));
	});

	return {
		data,
		isLoading,
		isError,
		periodSelectorProps,
	};
};
