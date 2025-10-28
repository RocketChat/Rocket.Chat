import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseActiveUsersOptions = { utc: boolean };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useActiveUsers = ({ utc }: UseActiveUsersOptions) => {
	const getActiveUsers = useEndpoint('GET', '/v1/engagement-dashboard/users/active-users');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/users/active', { utc }],

		queryFn: async () => {
			const { start, end } = getPeriodRange('last 30 days', utc);

			const response = await getActiveUsers({
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
