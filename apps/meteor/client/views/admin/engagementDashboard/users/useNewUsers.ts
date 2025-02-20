import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

export const useNewUsers = ({ period, utc }: { period: Period['key']; utc: boolean }) => {
	const getNewUsers = useEndpoint('GET', '/v1/engagement-dashboard/users/new-users');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/users/new', { period, utc }],

		queryFn: async () => {
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

		refetchInterval: 5 * 60 * 1000,
		throwOnError: true,
	});
};
