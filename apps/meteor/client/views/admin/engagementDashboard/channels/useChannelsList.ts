import { usePaginatedQueryKey } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseChannelsListOptions = {
	period: Period['key'];
};

export const useChannelsList = ({ period }: UseChannelsListOptions) => {
	const getChannelsList = useEndpoint('GET', '/v1/engagement-dashboard/channels/list');
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query: { period },
		getQueryKey: (query) => ['admin/engagement-dashboard/channels/list', query] as const,
	});
	const { offset, count } = paginatedQuery;

	const queryResult = useQuery({
		queryKey,

		queryFn: async () => {
			const { start, end } = getPeriodRange(period);

			const response = await getChannelsList({
				start: start.toISOString(),
				end: end.toISOString(),
				offset,
				count,
			});

			return response
				? {
						...response,
						start,
						end,
					}
				: undefined;
		},

		placeholderData: keepPreviousData,
		refetchInterval: 5 * 60 * 1000,
		throwOnError: true,
	});

	return { queryResult, paginationProps };
};
