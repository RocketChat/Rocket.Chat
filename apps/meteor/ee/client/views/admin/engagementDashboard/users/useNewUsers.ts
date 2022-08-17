import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getPeriodRange, Period } from '../dataView/periods';

type UseNewUsersOptions = { period: Period['key']; utc: boolean };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useNewUsers = ({ period, utc }: UseNewUsersOptions) => {
	const getNewUsers = useEndpoint('GET', '/v1/engagement-dashboard/users/new-users');

	return useQuery(
		['admin/engagement-dashboard/users/new', { period, utc }],
		async () => {
			const { start, end } = getPeriodRange(period, utc);

			const response = await getNewUsers({
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
};
