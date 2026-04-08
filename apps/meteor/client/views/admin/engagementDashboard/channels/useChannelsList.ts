import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseChannelsListOptions = {
	period: Period['key'];
	offset: number;
	count: number;
};

type UseChannelsListData = Awaited<ReturnType<ReturnType<typeof useEndpoint<'GET', '/v1/engagement-dashboard/channels/list'>>>> & {
	start: Date;
	end: Date;
};

export const useChannelsList = ({ period, offset, count }: UseChannelsListOptions): UseQueryResult<UseChannelsListData | undefined, Error> => {
	const getChannelsList = useEndpoint('GET', '/v1/engagement-dashboard/channels/list');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/channels/list', { period, offset, count }],

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
};
