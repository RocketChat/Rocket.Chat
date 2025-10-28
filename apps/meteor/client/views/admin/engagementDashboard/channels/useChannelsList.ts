import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseChannelsListOptions = {
	period: Period['key'];
	offset: number;
	count: number;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useChannelsList = ({ period, offset, count }: UseChannelsListOptions) => {
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
				hideRoomsWithNoActivity: true,
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
