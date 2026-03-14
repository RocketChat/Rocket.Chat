import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseUsersByTimeOfTheDayOptions = { period: Period['key']; utc: boolean };

type UseUsersByTimeOfTheDayData = Awaited<
	ReturnType<ReturnType<typeof useEndpoint<'GET', '/v1/engagement-dashboard/users/users-by-time-of-the-day-in-a-week'>>>
> & {
	start: Date;
	end: Date;
};

export const useUsersByTimeOfTheDay = ({ period, utc }: UseUsersByTimeOfTheDayOptions): UseQueryResult<UseUsersByTimeOfTheDayData | undefined, Error> => {
	const getUsersByTimeOfTheDay = useEndpoint('GET', '/v1/engagement-dashboard/users/users-by-time-of-the-day-in-a-week');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/users/users-by-time-of-the-day', { period, utc }],

		queryFn: async () => {
			const { start, end } = getPeriodRange(period, utc);

			const response = await getUsersByTimeOfTheDay({
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
