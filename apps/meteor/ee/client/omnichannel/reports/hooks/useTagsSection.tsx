import { Palette } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPeriodRange } from '../../../components/dashboards/periods';
import { usePeriodSelectorState } from '../../../components/dashboards/usePeriodSelectorState';
import { PERIOD_OPTIONS } from '../components/constants';

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
	const [period, periodSelectorProps] = usePeriodSelectorState(...PERIOD_OPTIONS);
	const getConversationsByTags = useEndpoint('GET', '/v1/livechat/analytics/dashboards/conversations-by-tags');

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery(
		['omnichannel-reports', 'conversations-by-tags', period],
		async () => {
			const { start, end } = getPeriodRange(period);
			const { data } = await getConversationsByTags({ start: start.toISOString(), end: end.toISOString() });
			return formatChartData(data);
		},
		{ useErrorBoundary: true },
	);

	const downloadProps = useMemo(
		() => ({
			attachmentName: 'Conversations_by_tags',
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
