import { useQuery } from '@tanstack/react-query';

import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { COLORS } from '../components/constants';
import { MOCK_CHANNELS_DATA } from '../mock';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		id: item.label,
		color: COLORS.info,
	}));

export const useChannelsSection = () => {
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
	} = useQuery(['reports', 'channels', period], () => {
		return Promise.resolve(formatChartData(MOCK_CHANNELS_DATA.data));
	});

	return {
		data,
		isLoading,
		isError,
		periodSelectorProps,
	};
};
