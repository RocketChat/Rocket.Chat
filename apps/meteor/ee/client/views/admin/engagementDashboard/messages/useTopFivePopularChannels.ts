import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseTopFivePopularChannelsOptions = { period: Period['key'] };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useTopFivePopularChannels = ({ period }: UseTopFivePopularChannelsOptions) => {
	const getTopFivePopularChannels = useEndpoint('GET', '/v1/engagement-dashboard/messages/top-five-popular-channels');

	return useQuery(
		['admin/engagement-dashboard/messages/top-five-popular-channels', { period }],
		async () => {
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
		{
			refetchInterval: 5 * 60 * 1000,
			useErrorBoundary: true,
		},
	);
};
