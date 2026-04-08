import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseTopFivePopularChannelsOptions = { period: Period['key'] };

type UseTopFivePopularChannelsData = Awaited<
	ReturnType<ReturnType<typeof useEndpoint<'GET', '/v1/engagement-dashboard/messages/top-five-popular-channels'>>>
> & {
	start: Date;
	end: Date;
};

export const useTopFivePopularChannels = ({ period }: UseTopFivePopularChannelsOptions): UseQueryResult<UseTopFivePopularChannelsData | undefined, Error> => {
	const getTopFivePopularChannels = useEndpoint('GET', '/v1/engagement-dashboard/messages/top-five-popular-channels');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/messages/top-five-popular-channels', { period }],

		queryFn: async () => {
			const { start, end } = getPeriodRange(period);

			const response = await getTopFivePopularChannels({
				start: start.toISOString(),
				end: end.toISOString(),
			});

			return response
				? {
					...response,
					start,
					end,
				}
				: undefined;
		},

		refetchInterval: 5 * 60 * 1000,
		throwOnError: true,
	});
};
