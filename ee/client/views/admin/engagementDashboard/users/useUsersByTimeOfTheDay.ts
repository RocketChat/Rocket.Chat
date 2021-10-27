import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange, Period } from '../utils/periods';

export const useUsersByTimeOfTheDay = ({ period, utc }: { period: Period['key']; utc: boolean }) =>
	useQuery(
		['admin/engagement-dashboard/users/users-by-time-of-the-day', { period }],
		async () => {
			const { start, end } = getPeriodRange(period, utc);

			const response = await getFromRestApi(
				'/v1/engagement-dashboard/users/users-by-time-of-the-day-in-a-week',
			)({
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
		},
	);
