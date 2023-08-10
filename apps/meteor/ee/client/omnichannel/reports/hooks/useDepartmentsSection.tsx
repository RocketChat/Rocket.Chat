import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { COLORS, PERIOD_OPTIONS } from '../components/constants';

const formatChartData = (data: { label: string; value: number }[] | undefined = []) =>
	data.map((item) => ({
		...item,
		color: COLORS.info,
	}));

export const useDepartmentsSection = () => {
	const [period, periodSelectorProps] = usePeriodSelectorState(...PERIOD_OPTIONS);
	const getConversationsByDepartment = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-department');

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-department', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const { data } = await getConversationsByDepartment({ start: start.toISOString(), end: end.toISOString() });
			return formatChartData(data);
		},
		{ useErrorBoundary: true },
	);

	const downloadProps = useMemo(
		() => ({
			attachmentName: 'Conversations_by_departments',
			headers: ['Date', 'Messages'],
			dataAvailable: !!data,
			dataExtractor(): unknown[][] | undefined {
				return data?.map(({ label, value }) => [label, value]);
			},
		}),
		[data],
	);

	return useMemo(
		() => ({
			data,
			isLoading,
			isError,
			config: {
				periodSelectorProps,
				downloadProps,
			},
		}),
		[data, isLoading, isError, periodSelectorProps, downloadProps],
	);
};
