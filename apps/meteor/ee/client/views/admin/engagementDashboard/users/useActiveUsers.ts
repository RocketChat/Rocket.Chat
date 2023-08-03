import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

import { getPeriodRange } from '../dataView/periods';

type UseActiveUsersOptions = { utc: boolean };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useActiveUsers = ({ utc }: UseActiveUsersOptions) => {
	const getActiveUsers = useEndpoint('GET', '/v1/engagement-dashboard/users/active-users');

	return useQuery(
		['admin/engagement-dashboard/users/active', { utc }],
		async () => {
			const { start, end } = getPeriodRange('last 30 days', utc);

			const response = await getActiveUsers({
				start: (utc ? moment.utc(start) : moment(start)).subtract(29, 'days').toISOString(),
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
