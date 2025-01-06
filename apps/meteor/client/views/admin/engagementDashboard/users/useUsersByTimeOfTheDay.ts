import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseUsersByTimeOfTheDayOptions = { period: Period['key']; utc: boolean };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useUsersByTimeOfTheDay = ({ period, utc }: UseUsersByTimeOfTheDayOptions) => {
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
