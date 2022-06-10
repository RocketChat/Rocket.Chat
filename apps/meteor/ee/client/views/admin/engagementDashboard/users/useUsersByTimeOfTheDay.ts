import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange, Period } from '../dataView/periods';

type UseUsersByTimeOfTheDayOptions = { period: Period['key']; utc: boolean };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useUsersByTimeOfTheDay = ({ period, utc }: UseUsersByTimeOfTheDayOptions) =>
	useQuery(
		['admin/engagement-dashboard/users/users-by-time-of-the-day', { period, utc }],
		async () => {
			const { start, end } = getPeriodRange(period, utc);

			const response = await getFromRestApi('/v1/engagement-dashboard/users/users-by-time-of-the-day-in-a-week')({
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
